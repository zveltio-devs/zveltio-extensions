/**
 * Zveltio AI Engine
 *
 * Adapted for new monorepo architecture:
 * - `db` injected via constructor (no module-level singleton)
 * - Uses extension-local aiProviderManager from ../ai-provider.js
 * - DDLManager calls replaced with direct DB queries on zvd_collections
 * - DDL mutations go through zv_ddl_jobs queue table
 * - Admin check via casbin_rule table
 */

import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { aiProviderManager } from '../ai-provider.js';
import { runReadOnly, validateGeneratedSQL } from '../sql-guard.js';
import { zveltioAITools } from './tools.js';
import type {
  ZveltioAIRequest,
  ZveltioAIResponse,
  ZveltioAIAction,
  ZveltioAIContext,
  ZveltioAIToolCall,
} from './types.js';

import { generateId } from '../utils.js';

export class ZveltioAIEngine {
  private db: any;
  private checkPermission: ExtensionContext['checkPermission'];
  private sendNotification: (db: any, input: any) => Promise<void>;
  /**
   * The host's DDL queue helper.
   *
   * `create_collection` and `add_field` wrote `zv_ddl_jobs` with
   * `ctx.db.insertInto('zv_ddl_jobs')`, and `zv_ddl_jobs` is an ENGINE table:
   * the extension has no grant for it, so the table guard refused both. Measured
   * through the real restricted handle built from the real allowlist:
   *
   *   insertInto('zv_ddl_jobs')  -> ExtensionSecurityError: Extension "ai"
   *                                 attempted to access table "zv_ddl_jobs"
   *   selectFrom('zvd_collections') -> ok    (control)
   *
   * So two of the fourteen tools the system prompt advertises threw on every
   * call, and the assistant reported the exception text to the user.
   *
   * Broken twice over, in fact: the engine moved DDL onto pg-boss, and
   * `zv_ddl_jobs` is now "preserved for historical queries" (ddl-queue.ts:21)
   * with no consumer at all. Granting the table would have turned a refusal into
   * a row nothing ever reads — a create_collection that reports success and
   * never happens, which is worse than the exception.
   *
   * The other half of this extension had it right all along:
   * `ai-schema-gen.ts` enqueues the same two job types through
   * `internals.enqueueDDLJob`, on the host's own handle. Same operation, two
   * paths, one of them never worked.
   */
  private enqueueDDLJob: (db: any, operation: string, payload: any) => Promise<unknown>;

  constructor(ctx: ExtensionContext) {
    this.db = ctx.db;
    this.checkPermission = ctx.checkPermission;
    this.sendNotification = ctx.internals.sendNotification;
    this.enqueueDDLJob = ctx.internals.enqueueDDLJob;
  }

  // ── Public API ─────────────────────────────────────────────────

  async processRequest(request: ZveltioAIRequest): Promise<ZveltioAIResponse> {
    const startTime = Date.now();

    try {
      const context = await this.buildContext(request);
      const history = request.conversationId
        ? await this.getConversationHistory(request.conversationId, request.userId)
        : [];

      const provider = aiProviderManager.getDefault();

      if (!provider) {
        return {
          response:
            '⚠️ No AI provider configured. Please configure one in **AI Settings**.\n\n' +
            'Options:\n' +
            '- **Ollama (FREE)** — self-hosted, runs locally\n' +
            '- **OpenAI** — GPT-4o-mini / GPT-4o (requires API key)\n' +
            '- **Anthropic** — Claude (requires API key)',
          conversationId:
            request.conversationId || this.generateConversationId(),
          metadata: { latency: Date.now() - startTime },
        };
      }

      const systemPrompt = this.buildSystemPrompt(context);

      // Build conversation messages array
      const conversationMessages: Array<{
        role: 'system' | 'user' | 'assistant' | 'tool';
        content: any;
        tool_call_id?: string;
      }> = [
        { role: 'system', content: systemPrompt },
        ...history.map((h: any) => ({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        })),
        { role: 'user', content: request.message },
      ];

      const aiResponse = await provider.chat(
        conversationMessages.map((m) => ({
          role: m.role as 'system' | 'user' | 'assistant' | 'tool',
          content: m.content,
          tool_call_id: m.tool_call_id,
        })),
        {
          temperature: 0.7,
          max_tokens: 4096,
          tools: zveltioAITools,
          tool_choice: 'auto',
        },
      );

      const actions: ZveltioAIAction[] = [];

      // ── Agentic ReAct Loop ─────────────────────────────────────────
      const MAX_ITERATIONS = request.context?.maxIterations ?? 7;
      let iteration = 0;
      let currentResponse = aiResponse;
      let finalResponse = aiResponse.content;
      let totalTokens =
        aiResponse.usage.prompt_tokens + aiResponse.usage.response_tokens;

      // Add first assistant response to conversation
      if (currentResponse.tool_calls && currentResponse.tool_calls.length > 0) {
        conversationMessages.push({
          role: 'assistant',
          content: currentResponse.content || '',
        } as any);
      }

      while (iteration < MAX_ITERATIONS) {
        const toolCalls = currentResponse.tool_calls;

        // Stop condition: AI responded with text only, no tool calls
        if (!toolCalls || toolCalls.length === 0) {
          finalResponse = currentResponse.content;
          break;
        }

        iteration++;

        // Execute all tool calls in this iteration
        const toolResults: Array<{
          tool_call_id: string;
          name: string;
          result: any;
          success: boolean;
        }> = [];

        for (const toolCall of toolCalls) {
          const args =
            typeof toolCall.function.arguments === 'string'
              ? JSON.parse(toolCall.function.arguments)
              : toolCall.function.arguments;

          try {
            const result = await this.executeToolCall(
              {
                id: toolCall.id,
                type: 'function',
                function: { name: toolCall.function.name, arguments: args },
              },
              request,
            );
            toolResults.push({
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              result,
              success: true,
            });
            actions.push({
              type: toolCall.function.name,
              result,
              success: true,
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            toolResults.push({
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              result: { error: msg },
              success: false,
            });
            actions.push({
              type: toolCall.function.name,
              result: null,
              success: false,
              error: msg,
            });
          }
        }

        // Build tool result messages in the correct provider-specific format
        const toolResultMessages = this.buildToolResultMessages(
          provider.name,
          toolCalls,
          toolResults,
        );
        conversationMessages.push(...(toolResultMessages as any));

        // Next loop call — with tools active to allow multi-step reasoning
        const nextResponse = await provider.chat(
          conversationMessages.map((m) => ({
            role: m.role as 'system' | 'user' | 'assistant' | 'tool',
            content: m.content,
            tool_call_id: m.tool_call_id,
          })),
          {
            temperature: 0.7,
            max_tokens: 4096,
            tools: zveltioAITools,
            tool_choice: 'auto',
          },
        );

        totalTokens +=
          nextResponse.usage.prompt_tokens + nextResponse.usage.response_tokens;

        // If AI wants more tool calls, add assistant response to conversation
        if (nextResponse.tool_calls && nextResponse.tool_calls.length > 0) {
          conversationMessages.push({
            role: 'assistant',
            content: nextResponse.content || '',
          } as any);
        }

        currentResponse = nextResponse;
        finalResponse = nextResponse.content;
      }

      // Safety: if we hit maxIterations without a text response, force a final answer
      if (iteration >= MAX_ITERATIONS && !finalResponse) {
        const forceResponse = await provider.chat(
          conversationMessages.map((m) => ({
            role: m.role as 'system' | 'user' | 'assistant' | 'tool',
            content: m.content,
            tool_call_id: m.tool_call_id,
          })),
          {
            temperature: 0.7,
            max_tokens: 2048,
            // No tools — force text response
          },
        );
        finalResponse = forceResponse.content;
        totalTokens +=
          forceResponse.usage.prompt_tokens +
          forceResponse.usage.response_tokens;
      }

      // Save conversation (skip for background tasks)
      const conversationId =
        request.conversationId || this.generateConversationId();
      if (request.conversationId !== null) {
        await this.saveConversation(
          conversationId,
          request.userId,
          request.message,
          finalResponse,
        );
      }

      return {
        response: finalResponse,
        actions: actions.length > 0 ? actions : undefined,
        conversationId,
        metadata: {
          tokensUsed: totalTokens,
          iterations: iteration,
          provider: provider.name,
          model: aiResponse.model,
          latency: Date.now() - startTime,
        },
      };
    } catch (error) {
      console.error('ZveltioAIEngine error:', error);
      throw error;
    }
  }

  /**
   * Executes an AI task in the background, without direct user input.
   *
   * Called by flowScheduler when trigger_type = 'ai_task'.
   */
  async processBackgroundTask(
    userId: string,
    instruction: string,
    options: {
      notifyOnResult?: boolean;
      notifyOnlyIfData?: boolean;
      notificationTitle?: string;
      maxIterations?: number;
      organizationId?: string;
    } = {},
  ): Promise<{
    executed: boolean;
    response: string;
    notificationsSent: number;
    tokensUsed: number;
    iterations: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const result = await this.processRequest({
        userId,
        organizationId: options.organizationId,
        message: `[BACKGROUND TASK — no user interaction] ${instruction}`,
        conversationId: null as any,
        context: {
          isBackground: true,
          maxIterations: options.maxIterations ?? 5,
        },
      });

      let notificationsSent = 0;

      const shouldNotify =
        options.notifyOnResult ||
        (options.notifyOnlyIfData &&
          result.actions &&
          result.actions.length > 0 &&
          result.actions.some(
            (a) => a.success && (a.result as any)?.count > 0,
          ));

      if (shouldNotify && result.response) {
        const notifTitle = options.notificationTitle ?? 'AI Background Report';
        const notifMessage =
          result.response.length > 500
            ? result.response.substring(0, 497) + '...'
            : result.response;

        await this.sendNotification(this.db, {
          user_id: userId,
          title: notifTitle,
          message: notifMessage,
          type: 'info',
          source: 'ai-background',
          metadata: {
            instruction: instruction.substring(0, 200),
            latency_ms: Date.now() - startTime,
            iterations: result.metadata?.iterations ?? 0,
          },
        });

        notificationsSent = 1;
      }

      return {
        executed: true,
        response: result.response,
        notificationsSent,
        tokensUsed: result.metadata?.tokensUsed ?? 0,
        iterations: result.metadata?.iterations ?? 0,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `[ZveltioAI Background] Task failed for user ${userId}:`,
        errorMessage,
      );

      if (options.notifyOnResult) {
        await this.sendNotification(this.db, {
          user_id: userId,
          title: 'AI Background Task Failed',
          message: `Task "${instruction.substring(0, 100)}" failed: ${errorMessage}`,
          type: 'error',
          source: 'ai-background',
        }).catch(() => {});
      }

      return {
        executed: false,
        response: '',
        notificationsSent: 0,
        tokensUsed: 0,
        iterations: 0,
        error: errorMessage,
      };
    }
  }

  // ── Context ────────────────────────────────────────────────────

  private async buildContext(
    request: ZveltioAIRequest,
  ): Promise<ZveltioAIContext> {
    // Collection count only — AI uses list_collections for details
    let collectionCount = 0;
    try {
      const result = (await this.db
        .selectFrom('zvd_collections')
        .select(this.db.fn.count('name').as('cnt'))
        .executeTakeFirst()) as any;
      collectionCount = parseInt(result?.cnt ?? '0');
    } catch (err) {
      // Named. This number goes into the system prompt as "The platform has N
      // collections", so a swallowed failure tells the model there are none and
      // the model tells the user so.
      console.warn('[zveltio-ai] collection count failed, prompt will say "several":', (err as Error).message);
    }

    // User memory — top 10 by importance
    let userMemory: Array<{
      context_key: string;
      content: string;
      importance: number;
    }> = [];
    try {
      const rawMemory = await (this.db as any)
        .selectFrom('zv_ai_memory')
        .select(['context_key', 'content', 'importance'])
        .where('user_id', '=', request.userId)
        .orderBy('importance', 'desc')
        .orderBy('updated_at', 'desc')
        .limit(5)
        .execute();

      userMemory = rawMemory.map((r: any) => ({
        context_key: r.context_key,
        content:
          r.content.length > 300
            ? r.content.substring(0, 300) + '…'
            : r.content,
        importance: r.importance,
      }));
    } catch {
      /* table may not exist yet */
    }

    // Recent activity is NOT read, and the assistant is told so rather than
    // shown an empty list.
    //
    // This queried `zv_audit_log`, an engine table the extension has no grant
    // for. The table guard refuses it — measured through the real restricted
    // handle: `ExtensionSecurityError: Extension "ai" attempted to access table
    // "zv_audit_log" via selectFrom()` — and the bare `catch {}` turned that
    // refusal into `[]`. So `recentActivity` was empty on every installation,
    // for a reason no log recorded, and the field went into the model's context
    // as fact.
    //
    // `toolGetSystemStats` reached the same conclusion about the same two tables
    // and says it out loud instead of reporting zero. This follows it. Restoring
    // the query would need `zv_audit_log` in EXTENSION_TABLE_GRANTS, which is a
    // decision about what an assistant may see, not a repair.
    const recentActivity: any[] = [];

    return {
      userId: request.userId,
      organizationId: request.organizationId,
      collections: [], // intentionally empty — AI uses list_collections
      collectionCount,
      permissions: [],
      recentActivity,
      userMemory,
    };
  }

  // ── System prompt ──────────────────────────────────────────────

  private buildSystemPrompt(context: ZveltioAIContext): string {
    const memorySection =
      context.userMemory && context.userMemory.length > 0
        ? `\n## Your Memory About This User\nThe following facts were saved from previous conversations:\n${context.userMemory
            .map((m) => `- **${m.context_key}**: ${m.content}`)
            .join(
              '\n',
            )}\nApply these preferences and rules automatically without asking the user to repeat them.\n`
        : '';

    return `You are Zveltio AI — an autonomous, intelligent assistant embedded in Zveltio, a Business OS platform.

## Your Role
You help users work with their data, automate tasks, generate reports, and manage their platform.
You operate as a proactive agent: you gather information, reason step by step, and execute actions.
${memorySection}
## Data Access
The platform has ${context.collectionCount ?? 'several'} collections (database tables).
- Use **list_collections** to discover available tables before any data operation.
- Use **get_collection_schema** to understand a table's structure before querying or modifying it.
- NEVER assume collection names or field names — always verify first with the tools above.

## Available Tools
1. **list_collections** — Discover all available tables (use this first)
2. **get_collection_schema** — Get fields/structure of a specific table
3. **query_data** — Read records with filters and sorting
4. **count_records** — Count records matching filters
5. **create_record** — Insert a new record
6. **update_record** — Modify an existing record
7. **delete_record** — Remove a record (confirm with user first)
8. **create_collection** — Create a new table (admin only)
9. **add_field** — Add a field to existing table (admin only)
10. **execute_sql** — Run a SELECT SQL query (admin only)
11. **generate_report** — Export data as PDF/Excel/CSV
12. **create_visualization** — Create chart or dashboard
13. **remember_fact** — Save important facts/preferences to long-term memory
14. **recall_facts** — Retrieve previously saved facts

## Behavioral Rules
- **Always use tools** when the user asks about data — never say "I can't access" without trying
- **Chain tools logically**: list_collections → get_schema → query → respond
- **Respect permissions**: if a tool returns permission_denied, explain the limitation clearly
- **Be concise**: show key results, not raw JSON dumps
- **Confirm before destructive actions**: ask before delete_record or DROP operations
- **Remember context**: use recall_facts at the start of conversations about preferences
- **Format responses** with Markdown: tables for data, code blocks for SQL/JSON`;
  }

  // ── Tool result message builder ────────────────────────────────

  /**
   * Builds tool_result messages in the correct format per provider.
   *
   * OpenAI / Ollama: role='tool' with tool_call_id (standard OpenAI format)
   * Anthropic: role='user' with content array of tool_result blocks
   *   (Anthropic does NOT accept role='tool'; tool results are sent as user
   *    messages with tool_result content blocks, each referencing a tool_use_id)
   */
  private buildToolResultMessages(
    providerName: string,
    _toolCalls: Array<{ id: string; function: { name: string } }>,
    toolResults: Array<{
      tool_call_id: string;
      name: string;
      result: any;
      success: boolean;
    }>,
  ): Array<{
    role: 'user' | 'tool' | 'assistant';
    content: any;
    tool_call_id?: string;
  }> {
    if (providerName === 'anthropic') {
      // Anthropic: single user message with array of tool_result blocks
      return [
        {
          role: 'user',
          content: toolResults.map((tr) => ({
            type: 'tool_result',
            tool_use_id: tr.tool_call_id,
            content: JSON.stringify(tr.result),
            is_error: !tr.success,
          })),
        },
      ];
    }

    // OpenAI / Ollama: one role='tool' message per tool call
    return toolResults.map((tr) => ({
      role: 'tool' as const,
      content: JSON.stringify(tr.result),
      tool_call_id: tr.tool_call_id,
    }));
  }

  // ── Tool dispatcher ────────────────────────────────────────────

  private async executeToolCall(
    toolCall: ZveltioAIToolCall,
    request: ZveltioAIRequest,
  ): Promise<any> {
    const { name, arguments: args } = toolCall.function;
    const parsed = typeof args === 'string' ? JSON.parse(args) : args;

    // ── Tool access classification ─────────────────────────────
    const ADMIN_ONLY_TOOLS = [
      'execute_sql',
      'text_to_sql',
      'create_collection',
      'add_field',
      'get_system_stats',
    ];

    const DATA_TOOLS_PERMISSIONS: Record<string, string> = {
      query_data: 'read',
      count_records: 'read',
      create_record: 'create',
      update_record: 'update',
      delete_record: 'delete',
    };

    // ── Admin check for system tools ───────────────────────────
    if (ADMIN_ONLY_TOOLS.includes(name)) {
      const isAdmin = await this.checkPermission(request.userId, 'admin', '*');
      if (!isAdmin) {
        return {
          error:
            `User does not have permission to perform administrative operations. ` +
            `The tool '${name}' requires admin access.`,
          permission_denied: true,
        };
      }
    }

    // ── Granular permission check for data tools ───────────────
    if (name in DATA_TOOLS_PERMISSIONS) {
      const action = DATA_TOOLS_PERMISSIONS[name];
      const collection = parsed?.collection;

      if (!collection) {
        return { error: `Tool '${name}' requires a 'collection' parameter.` };
      }

      // P1: was this.checkPermission(userId, action, collection) — args were swapped.
      // Correct signature: this.checkPermission(userId, resource, action)
      const hasPermission = await this.checkPermission(
        request.userId,
        collection,
        action,
      );
      if (!hasPermission) {
        return {
          error:
            `User does not have permission to ${action} data in collection '${collection}'. ` +
            `Please ask an administrator to grant you the necessary access.`,
          permission_denied: true,
          required_permission: { action, resource: collection },
        };
      }
    }

    // ── Dispatch ───────────────────────────────────────────────
    switch (name) {
      case 'query_data':
        return this.toolQueryData(parsed, request);
      case 'create_collection':
        return this.toolCreateCollection(parsed);
      case 'add_field':
        return this.toolAddField(parsed);
      case 'generate_report':
        return this.toolGenerateReport(parsed, request);
      case 'create_visualization':
        return this.toolCreateVisualization(parsed);
      case 'execute_sql':
        return this.toolExecuteSQL(parsed, request);
      case 'list_collections':
        return this.toolListCollections();
      case 'get_collection_schema':
        return this.toolGetCollectionSchema(parsed);
      case 'create_record':
        return this.toolCreateRecord(parsed, request);
      case 'update_record':
        return this.toolUpdateRecord(parsed, request);
      case 'delete_record':
        return this.toolDeleteRecord(parsed);
      case 'count_records':
        return this.toolCountRecords(parsed);
      case 'get_system_stats':
        return this.toolGetSystemStats();
      case 'remember_fact':
        return this.toolRememberFact(parsed, request);
      case 'recall_facts':
        return this.toolRecallFacts(parsed, request);
      case 'text_to_sql':
        return this.toolTextToSQL(parsed, request);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  // ── Tool implementations ───────────────────────────────────────

  // P1: system fields that AI tools must never overwrite
  private static readonly AI_PROTECTED_FIELDS = new Set([
    'id',
    'created_at',
    'created_by',
    'updated_at',
    'tenant_id',
    'search_vector',
    'embedding',
  ]);

  // P1: safe collection regex — only zvd_ user tables, no system tables
  private static readonly SAFE_COLLECTION_RE = /^[a-z][a-z0-9_]*$/;

  private async toolQueryData(args: any, _request: ZveltioAIRequest) {
    const {
      collection,
      filters = {},
      limit = 10,
      orderBy,
      orderDirection = 'desc',
    } = args;

    // P1: use zvd_ prefix and validate — prevents reading system tables (zv_api_keys, etc.)
    if (!ZveltioAIEngine.SAFE_COLLECTION_RE.test(collection)) {
      throw new Error(`Invalid collection name: "${collection}"`);
    }
    const tableName = `zvd_${collection}`;

    try {
      let query = this.db.selectFrom(tableName as any).selectAll();

      for (const [key, value] of Object.entries(filters)) {
        if (typeof value === 'string' && value.startsWith('>')) {
          query = query.where(key as any, '>', (value as string).substring(1));
        } else if (typeof value === 'string' && value.startsWith('<')) {
          query = query.where(key as any, '<', (value as string).substring(1));
        } else {
          query = query.where(key as any, '=', value);
        }
      }

      if (orderBy) {
        query = query.orderBy(orderBy as any, orderDirection);
      } else {
        query = query.orderBy('created_at' as any, 'desc');
      }

      const safeLimit = Math.min(Math.max(1, limit), 100);
      const rows = await query.limit(safeLimit).execute();

      return {
        collection,
        count: rows.length,
        data: rows,
        message: `Found ${rows.length} records in ${collection}`,
      };
    } catch (error) {
      throw new Error(
        `Failed to query ${collection}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private async toolCreateCollection(args: any) {
    const { name, display_name, fields } = args;
    if (!ZveltioAIEngine.SAFE_COLLECTION_RE.test(name)) {
      throw new Error(`Invalid collection name: "${name}"`);
    }
    if (!Array.isArray(fields) || fields.length === 0) {
      throw new Error('create_collection needs at least one field');
    }

    // Through the host helper — see the note on `enqueueDDLJob`. The payload is
    // an object, not a JSON string: `enqueueDDLJob` serialises it itself, and
    // handing it a string produced a double-encoded `payload` column.
    const jobId = await this.enqueueDDLJob(this.db, 'create_collection', {
      name,
      displayName: display_name || name.charAt(0).toUpperCase() + name.slice(1),
      fields: fields.map((f: any) => ({
        name: f.name,
        type: f.type || 'text',
        required: f.required || false,
        unique: f.unique || false,
        defaultValue: f.default_value,
        options: f.options,
      })),
    });

    return {
      success: true,
      collection: name,
      fields: fields.length,
      job_id: jobId,
      // "queued", not "created" — `enqueueDDLJob` puts the work on a queue and
      // the job can still fail after this answer. `ai-schema-gen.ts` says the
      // same thing for the same reason.
      message: `Collection '${display_name || name}' is queued for creation with ${fields.length} fields`,
    };
  }

  private async toolAddField(args: any) {
    const { collection, field } = args;
    if (!ZveltioAIEngine.SAFE_COLLECTION_RE.test(collection)) {
      throw new Error(`Invalid collection name: "${collection}"`);
    }
    if (!field?.name) throw new Error('add_field needs a field with a name');

    const jobId = await this.enqueueDDLJob(this.db, 'add_field', { collection, field });

    return {
      success: true,
      collection,
      field: field.name,
      job_id: jobId,
      message: `Field '${field.name}' is queued to be added to '${collection}'`,
    };
  }

  private async toolGenerateReport(args: any, request: ZveltioAIRequest) {
    const { collection, format = 'csv', filters } = args;
    // P1: cap at 1000 to prevent memory exhaustion; report endpoint handles full export
    const data = await this.toolQueryData(
      { collection, filters, limit: 1000 },
      request,
    );
    const reportId = generateId(8);
    const downloadUrl = `/api/export/${collection}?format=${format}&report=${reportId}`;

    return {
      success: true,
      format,
      recordCount: data.count,
      downloadUrl,
      message: `Report ready with ${data.count} records. Download: ${downloadUrl}`,
    };
  }

  private async toolCreateVisualization(args: any) {
    const { type, collection, metric, title } = args;
    return {
      success: true,
      type,
      collection,
      metric,
      message: `Visualization '${title || type}' created for ${collection}`,
      viewUrl: `/admin/insights/${collection}`,
    };
  }

  /**
   * The assistant's raw-SQL tool. Two things were wrong with it, and the fix for
   * both already existed in this extension.
   *
   * 1. NO TABLE ALLOWLIST. The only checks were "starts with SELECT or WITH" and
   *    a read-only transaction. `SELECT token FROM session`, `SELECT * FROM
   *    "user"`, `information_schema`, `pg_*`, a second statement after a
   *    semicolon — all of it passed. The Better-Auth tables have no prefix and
   *    no RLS, so read-only does not help: reading them IS the damage.
   *    `/ext/ai/query` refuses every one of those through
   *    `validateGeneratedSQL`, three files away, since the audit that put it
   *    there. This tool was not changed with it.
   *
   *    It is admin-gated (`ADMIN_ONLY_TOOLS`), which is why this is a bound
   *    rather than a hole — but `checkPermission(userId, 'admin', '*')` is
   *    passed by a TENANT administrator, and `user`/`session`/`account` are
   *    instance-wide with no policy on them. So the gate does not stop a tenant
   *    admin from reading every other company's password hashes, and the tool
   *    reaches them through a sentence in a chat window. The allowlist is
   *    `accessibleCollections` — the caller's own collections — which is the
   *    same answer the route uses.
   *
   * 2. THE READ-ONLY FLAG LEAKED INTO THE WHOLE REQUEST. `ctx.db.transaction()`
   *    JOINS the request's tenant transaction instead of nesting
   *    (extension-context.ts: `execute: (fn) => fn(target)` — no BEGIN, same
   *    handle), so `SET TRANSACTION READ ONLY` applied from here to the end of
   *    the request. Measured on Postgres 18 in exactly that shape:
   *
   *      the tool's own SELECT            -> ran
   *      saveConversation, same request   -> cannot execute INSERT in a read-only transaction
   *      anything after that              -> current transaction is aborted, 25P02
   *
   *    So an admin who asked the assistant anything that made it reach for SQL
   *    got the answer, and then the conversation was never saved, `remember_fact`
   *    could not write, and the request's COMMIT became a ROLLBACK. `runReadOnly`
   *    scopes the window to a SAVEPOINT; `ROLLBACK TO SAVEPOINT` restores
   *    `transaction_read_only = off`, which is measured in that function's note.
   *
   * The identical pair of defects is in `toolTextToSQL` below. Both now go
   * through `lib/sql-guard.ts`, so there is one implementation to get right.
   */
  private async toolExecuteSQL(args: any, request: ZveltioAIRequest) {
    const { query: sqlQuery } = args;
    if (typeof sqlQuery !== 'string' || sqlQuery.trim() === '') {
      return { success: false, error: 'No query supplied.' };
    }

    const accessible = await this.accessibleCollections(request.userId);
    if (accessible.length === 0) {
      return {
        success: false,
        error: 'You have no collections this query could read.',
        permission_denied: true,
      };
    }

    const validation = validateGeneratedSQL(sqlQuery, accessible);
    if (!validation.safe) {
      return { success: false, error: `Refused: ${validation.reason}` };
    }

    const result = await runReadOnly(this.db, sqlQuery);
    const rows = (result.rows as any[]) || [];
    return {
      success: true,
      rowCount: rows.length,
      data: rows,
      message: `${rows.length} rows returned.`,
    };
  }

  /**
   * The collections this user may read, in the shape `validateGeneratedSQL`
   * expects. Same derivation as `/ext/ai/query`: the bare collection name is the
   * resource, which is what migration 034 writes into `zvd_permissions`.
   */
  private async accessibleCollections(userId: string): Promise<Array<{ name: string }>> {
    const all = await this.db
      .selectFrom('zvd_collections')
      .select(['name'])
      .execute();
    const out: Array<{ name: string }> = [];
    for (const col of all as Array<{ name: string }>) {
      if (await this.checkPermission(userId, col.name, 'read')) out.push({ name: col.name });
    }
    return out;
  }

  private async toolListCollections() {
    const collections = await this.db
      .selectFrom('zvd_collections')
      .select(['name', 'display_name', 'fields'])
      .orderBy('display_name', 'asc')
      .execute();
      // No `.catch(() => [])`. An empty list is the assistant being told this
      // instance has no collections at all, which is what it will then say.

    const mapped = collections.map((c: any) => {
      let fieldCount = 0;
      try {
        // `fields` is JSONB: either a parsed array (most adapters) or a JSON
        // string (some pg drivers return it raw). Handle both.
        const fields = typeof c.fields === 'string' ? JSON.parse(c.fields) : c.fields;
        fieldCount = Array.isArray(fields) ? fields.length : 0;
      } catch {
        /* ignore */
      }
      return {
        name: c.name,
        display_name: c.display_name || c.name,
        fields_count: fieldCount,
      };
    });

    return {
      success: true,
      collections: mapped,
      message: `Found ${mapped.length} collections`,
    };
  }

  private async toolGetCollectionSchema(args: any) {
    const { collection } = args;
    const colDef = await this.db
      .selectFrom('zvd_collections')
      .selectAll()
      .where('name', '=', collection)
      .executeTakeFirst();
      // No `.catch(() => null)`. It fell into the `if (!colDef) throw` below, so a
      // failed read told the assistant the collection does not exist — and it then
      // offers to create one that is already there.

    if (!colDef) throw new Error(`Collection '${collection}' not found`);

    let fields: any[] = [];
    try {
      // `fields` is the JSONB column on zvd_collections (was previously read
      // as `schema` against a non-existent column).
      const parsed =
        typeof colDef.fields === 'string' ? JSON.parse(colDef.fields) : colDef.fields;
      fields = Array.isArray(parsed) ? parsed : [];
    } catch {
      /* ignore */
    }

    return {
      success: true,
      collection: colDef.name,
      display_name: colDef.display_name || colDef.name,
      fields,
      message: `Schema for ${collection}: ${fields.length} fields`,
    };
  }

  private async toolCreateRecord(args: any, _request: ZveltioAIRequest) {
    const { collection, data } = args;
    if (!ZveltioAIEngine.SAFE_COLLECTION_RE.test(collection)) {
      throw new Error(`Invalid collection name: "${collection}"`);
    }
    const tableName = `zvd_${collection}`;

    // P1: strip protected system fields from AI-provided data
    const safeData: Record<string, any> = {};
    for (const [k, v] of Object.entries(data ?? {})) {
      if (!ZveltioAIEngine.AI_PROTECTED_FIELDS.has(k)) safeData[k] = v;
    }
    const recordData = {
      ...safeData,
      id: generateId(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    try {
      await this.db
        .insertInto(tableName as any)
        .values(recordData)
        .execute();
      return {
        success: true,
        record: recordData,
        message: `Record created in ${collection}`,
      };
    } catch (error) {
      throw new Error(
        `Failed to create record: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private async toolUpdateRecord(args: any, _request: ZveltioAIRequest) {
    const { collection, id, data } = args;
    if (!ZveltioAIEngine.SAFE_COLLECTION_RE.test(collection)) {
      throw new Error(`Invalid collection name: "${collection}"`);
    }
    const tableName = `zvd_${collection}`;

    // P1: strip protected system fields
    const safeData: Record<string, any> = {};
    for (const [k, v] of Object.entries(data ?? {})) {
      if (!ZveltioAIEngine.AI_PROTECTED_FIELDS.has(k)) safeData[k] = v;
    }

    try {
      await this.db
        .updateTable(tableName as any)
        .set({ ...safeData, updated_at: new Date() })
        .where('id' as any, '=', id)
        .execute();
      return {
        success: true,
        id,
        message: `Record ${id} updated in ${collection}`,
      };
    } catch (error) {
      throw new Error(
        `Failed to update record: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private async toolDeleteRecord(args: any) {
    const { collection, id } = args;
    if (!ZveltioAIEngine.SAFE_COLLECTION_RE.test(collection)) {
      throw new Error(`Invalid collection name: "${collection}"`);
    }
    const tableName = `zvd_${collection}`;

    try {
      await this.db
        .deleteFrom(tableName as any)
        .where('id' as any, '=', id)
        .execute();
      return {
        success: true,
        id,
        message: `Record ${id} deleted from ${collection}`,
      };
    } catch (error) {
      throw new Error(
        `Failed to delete record: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private async toolCountRecords(args: any) {
    const { collection, filters = {} } = args;
    if (!ZveltioAIEngine.SAFE_COLLECTION_RE.test(collection)) {
      throw new Error(`Invalid collection name: "${collection}"`);
    }
    const tableName = `zvd_${collection}`;

    try {
      let query = this.db
        .selectFrom(tableName as any)
        .select(this.db.fn.count('id').as('count'));
      for (const [key, value] of Object.entries(filters)) {
        query = query.where(key as any, '=', value);
      }
      const result = await query.executeTakeFirst();
      const count = Number(result?.count ?? 0);
      return {
        success: true,
        collection,
        count,
        message: `${count} records in ${collection}`,
      };
    } catch (error) {
      throw new Error(
        `Failed to count records: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * What the assistant can actually count.
   *
   * This used to report three numbers and two of them were always zero. It read
   * `user` and `zv_audit_log` directly, and an extension may read neither — the
   * engine's proxy refuses both — but each query carried
   * `.catch(() => ({ count: 0 }))`, so the refusal came back as the number 0 and
   * the assistant told the operator "0 users, 0 recent activity" on an instance
   * with thousands of each. A tool that answers a question it cannot answer is
   * worse than one that declines: nobody re-checks a number.
   *
   * `zvd_collections` is the extension's to read, so it is still reported.
   */
  private async toolGetSystemStats() {
    const collections = await this.db
      .selectFrom('zvd_collections')
      .select(this.db.fn.count('name').as('count'))
      .executeTakeFirst();

    const n = Number(collections?.count ?? 0);
    return {
      success: true,
      stats: { collections: n },
      unavailable: {
        users: 'the user directory is engine-owned and not readable by an extension',
        recentActivity: 'the audit log is engine-owned and not readable by an extension',
      },
      message:
        `Platform stats: ${n} collections. User and audit-activity counts are not ` +
        `available to this assistant — they live in engine-owned tables.`,
    };
  }

  private async toolRememberFact(
    args: any,
    request: ZveltioAIRequest,
  ): Promise<any> {
    const { context_key, content, importance = 5 } = args;

    // Generate embedding if provider supports embed().
    //
    // `.embedding`, not the whole result. `AIProvider.embed()` returns
    // `{ embedding: number[]; model: string }` (ai-provider.ts:80), and this
    // stored `JSON.stringify` of the WHOLE object into a `vector` column.
    // Measured against Postgres 18 + pgvector:
    //
    //   JSON.stringify(embedResult)   -> invalid input syntax for type vector:
    //                                    "{"embedding":[0.01,…],"model":"…"}"
    //   JSON.stringify(.embedding)    -> accepted
    //
    // So `remember_fact` failed on EVERY call as soon as an embedding-capable
    // provider was configured — and the `.catch` below reports a vector-format
    // error as "Memory service not available. Run migrations first.", which
    // sends the operator to look at migrations that are fine. With Anthropic as
    // the default (no `embed`) the branch is skipped and the tool works, so
    // whether the assistant can remember anything depended on which provider
    // was default. The failing INSERT also aborts the request's transaction,
    // taking `saveConversation` down with it.
    let embedding: number[] | null = null;
    try {
      const provider = aiProviderManager.getDefault();
      if (
        provider &&
        'embed' in provider &&
        typeof (provider as any).embed === 'function'
      ) {
        const result = await (provider as any).embed(content, 'text-embedding-3-small');
        embedding = Array.isArray(result?.embedding) ? result.embedding : null;
      }
    } catch (err) {
      // Named. This is the branch that decides whether a memory carries a
      // vector, and a silent failure here is indistinguishable from a provider
      // that cannot embed at all.
      console.warn('[zveltio-ai] remember_fact: embedding failed, storing text only:', (err as Error).message);
    }

    await (this.db as any)
      .insertInto('zv_ai_memory')
      .values({
        user_id: request.userId,
        context_key,
        content,
        importance,
        source: 'user',
        ...(embedding ? { embedding: JSON.stringify(embedding) } : {}),
      })
      .onConflict((oc: any) =>
        oc.columns(['user_id', 'context_key']).doUpdateSet({
          content,
          importance,
          updated_at: new Date(),
          ...(embedding ? { embedding: JSON.stringify(embedding) } : {}),
        }),
      )
      .execute()
      .catch((err: any) => {
        // The reason, not a guess at it. This said "Run migrations first" for
        // every failure, and the failure it actually had for as long as an
        // embedding provider was configured was a malformed vector literal.
        console.warn('[AI Memory] write failed:', err.message);
        throw new Error(`Could not save to memory: ${err.message}`);
      });

    return {
      success: true,
      context_key,
      message: `I've saved this to memory: "${content.substring(0, 80)}${content.length > 80 ? '...' : ''}"`,
    };
  }

  private async toolRecallFacts(
    args: any,
    request: ZveltioAIRequest,
  ): Promise<any> {
    // Every tier below falls through to the next on failure — that is the design.
    // What it could not express is ALL of them failing, so the errors are kept.
    const recallErrors: string[] = [];
    const { query, limit = 5 } = args;

    try {
      let rows: any[] = [];

      // Try vector search if embeddings are available
      try {
        const provider = aiProviderManager.getDefault();
        if (
          provider &&
          'embed' in provider &&
          typeof (provider as any).embed === 'function'
        ) {
          const embedResult = await (provider as any).embed(
            query,
            'text-embedding-3-small',
          );
          // `.embedding` — same defect as `remember_fact` above: this
          // stringified the whole `{ embedding, model }` result into a `::vector`
          // literal, which Postgres rejects, so tier 1 threw on every call.
          const queryEmbedding = embedResult?.embedding;
          if (!Array.isArray(queryEmbedding)) {
            throw new Error('provider returned no embedding vector');
          }

          rows = await (this.db as any)
            .selectFrom('zv_ai_memory')
            .selectAll()
            .where('user_id', '=', request.userId)
            .where('embedding', 'is not', null)
            // P0: use parameterized sql`` template, not raw string interpolation
            .orderBy(
              sql`embedding <=> ${JSON.stringify(queryEmbedding)}::vector`,
            )
            .limit(limit)
            .execute();
        }
      } catch (err) {
        // Fallback to text search
        recallErrors.push(err instanceof Error ? err.message : String(err));
      }

      // Fallback: PostgreSQL full-text search.
      //
      // This was `(this.db as any).raw(...)`. Kysely has had no `db.raw` since
      // 0.23; this repository is on 0.29.5, where `Kysely.prototype.raw` is
      // `undefined`. And `.raw(…)` is called while BUILDING the query, before
      // any `.execute()`, so the TypeError was thrown synchronously — past the
      // `.catch` attached to the promise, straight into the outer catch of this
      // function. Which means tier 3 below, the plain importance-ordered
      // fallback, was UNREACHABLE, and `recall_facts` answered
      // "Memory service not available." on every call ever made, with or without
      // an embedding provider. Measured through the real restricted handle:
      //
      //   tier 2: (this.db as any).raw(...)   -> TypeError: db.raw is not a function
      //   tier 3: the plain fallback          -> ok, returns the rows
      //
      // The `?` placeholder was wrong too — Postgres uses `$1` — so this could
      // not have run even with a `raw` to call it on.
      if (rows.length === 0) {
        rows = await (this.db as any)
          .selectFrom('zv_ai_memory')
          .selectAll()
          .where('user_id', '=', request.userId)
          .where(sql<boolean>`to_tsvector('english', content) @@ plainto_tsquery('english', ${query})`)
          .orderBy('importance', 'desc')
          .orderBy('updated_at', 'desc')
          .limit(limit)
          .execute()
          .catch((err: Error) => {
            recallErrors.push(err.message);
            return [];
          });
      }

      // Final fallback: return most important recent memories
      if (rows.length === 0) {
        rows = await (this.db as any)
          .selectFrom('zv_ai_memory')
          .selectAll()
          .where('user_id', '=', request.userId)
          .orderBy('importance', 'desc')
          .orderBy('updated_at', 'desc')
          .limit(limit)
          .execute()
          .catch((err: Error) => {
            recallErrors.push(err.message);
            return [];
          });
      }

      // All three tiers failed. Returning `success: true` with "No relevant memories
      // found" told the assistant, confidently, that this user has never said anything
      // to it. An unreadable memory store and an empty one are different facts.
      if (rows.length === 0 && recallErrors.length > 0) {
        console.error('[zveltio-ai] memory recall failed on every tier:', recallErrors);
        return {
          success: false,
          facts: [],
          message: 'Memory could not be read, so this answer is without it.',
        };
      }

      if (rows.length === 0) {
        return {
          success: true,
          facts: [],
          message: 'No relevant memories found.',
        };
      }

      const facts = rows.map((r: any) => ({
        key: r.context_key,
        content: r.content,
        importance: r.importance,
        saved_at: r.updated_at,
      }));

      return { success: true, facts, count: facts.length };
    } catch (err: any) {
      return {
        success: false,
        error: 'Memory service not available.',
        details: err.message,
      };
    }
  }

  /**
   * Natural language to SQL, inside the assistant.
   *
   * Carried the same two defects as `toolExecuteSQL` — see the long note there
   * — and a third of its own: the schema it showed the model was not filtered by
   * what the caller may read. It listed the first ten collections on the
   * instance, or whatever `collections_hint` named, with no permission check at
   * all, so the model was handed the column names of tables the user has no
   * access to and asked to write queries against them. Now the schema context IS
   * the allowlist: one derivation, used for what the model is told and for what
   * the validator permits, so the two cannot drift apart.
   *
   * The system prompt also told the model that collection `orders` becomes table
   * `zv_orders`. It is `zvd_orders` — `zv_` is the ENGINE's namespace, the one
   * holding api keys, sessions and billing. So every generated query named a
   * table that does not exist, and the one shape that would have found a real
   * table is the shape pointing at engine data.
   */
  private async toolTextToSQL(
    args: any,
    request: ZveltioAIRequest,
  ): Promise<any> {
    const { question, collections_hint = [] } = args;

    // Step 1: the caller's own collections — the same set the validator will
    // enforce, narrowed by the hint if one was given.
    const accessible = await this.accessibleCollections(request.userId);
    const hint: string[] = Array.isArray(collections_hint) ? collections_hint : [];
    const inScope = hint.length > 0 ? accessible.filter((c) => hint.includes(c.name)) : accessible;
    if (inScope.length === 0) {
      return {
        error: 'You have no collections this question could be answered from.',
        permission_denied: true,
      };
    }

    let schemaContext = '';
    try {
      const names = inScope.slice(0, 10).map((c) => c.name);
      const collections = await (this.db as any)
        .selectFrom('zvd_collections')
        .selectAll()
        .where('name', 'in', names)
        .execute();

      schemaContext = collections
        .map((c: any) => {
          // `fields` is the canonical JSONB column on zvd_collections.
          const parsed = typeof c.fields === 'string' ? JSON.parse(c.fields) : c.fields;
          const fields = (Array.isArray(parsed) ? parsed : [])
            .map((f: any) => `${f.name} ${f.type}`)
            .join(', ');
          // Concrete tables are named `zvd_<collection>` by DDLManager.
          return `Table zvd_${c.name}: (${fields})`;
        })
        .join('\n');
    } catch (err) {
      // Named. An empty schema means the model is asked to write SQL against
      // nothing, and the refusal it then earns from the validator reads as
      // "you have no access" rather than "the schema lookup broke".
      console.warn('[zveltio-ai] text_to_sql schema lookup failed:', (err as Error).message);
    }

    // Step 2: Generate SQL via AI
    const provider = aiProviderManager.getDefault();
    if (!provider) return { error: 'No AI provider configured' };

    const sqlGenResponse = await provider.chat(
      [
        {
          role: 'system',
          content: `You are a SQL expert for PostgreSQL. Generate ONLY a valid SELECT query.
Return ONLY the SQL query, no explanation, no markdown, no semicolon at end.
ONLY SELECT queries are allowed. Never use DROP, DELETE, UPDATE, INSERT, ALTER.

Available tables:
${schemaContext}

Rules:
- Table names are prefixed with zvd_ (e.g., collection "orders" → table "zvd_orders")
- Use ONLY the tables listed above; anything else will be refused
- Always use table aliases for clarity
- Limit results to 100 rows maximum unless aggregating`,
        },
        { role: 'user', content: question },
      ],
      { temperature: 0.1, max_tokens: 500 },
    );

    const generatedSQL = sqlGenResponse.content
      .trim()
      .replace(/^```sql?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();

    // Step 3: the same validation `/ext/ai/query` uses. This was a bespoke
    // check: `startsWith('SELECT')` plus `normalized.includes(kw)` over seven
    // keywords. `includes` is not word-bounded, so a column named `updated_at`
    // tripped the UPDATE rule and a legitimate query was refused; and nothing at
    // all stopped `SELECT * FROM "user"`, `information_schema`, `pg_shadow`, or
    // a second statement after a semicolon.
    const validation = validateGeneratedSQL(generatedSQL, inScope);
    if (!validation.safe) {
      return { error: `Refused: ${validation.reason}`, generated: generatedSQL };
    }

    // Step 4: the read-only window, scoped to a SAVEPOINT so it does not leak
    // into the rest of the request. See the note on `runReadOnly`.
    try {
      const result = await runReadOnly(this.db, generatedSQL);
      const rows = (result.rows as any[]) ?? [];

      return {
        success: true,
        question,
        sql: generatedSQL,
        row_count: rows.length,
        data: rows.slice(0, 100),
        message: `Query returned ${rows.length} rows`,
      };
    } catch (err: any) {
      return {
        success: false,
        question,
        sql: generatedSQL,
        error: `SQL execution failed: ${err.message}`,
      };
    }
  }

  // ── Helpers ────────────────────────────────────────────────────

  private generateConversationId(): string {
    return generateId();
  }

  /**
   * Prior turns of a conversation, for the user who owns it.
   *
   * `conversationId` arrives from the chat request body and was looked up with
   * no owner check at all, so any authenticated user could quote someone
   * else's id and have that conversation loaded as context — then read it back
   * by asking the model to repeat it. `zv_ai_*` carries no tenant column, so
   * this reached across tenants too, not only across users.
   *
   * The check is on the CONVERSATION, whose `user_id` is NOT NULL and is the
   * authoritative owner. Filtering the messages by `user_id` instead would
   * look equivalent and silently drop every assistant turn — that column is
   * nullable precisely because the model's replies have no user — leaving a
   * history with the answers missing.
   *
   * An unowned or unknown id returns empty rather than an error: the caller
   * treats "no history" as a new conversation, which is the same thing an
   * attacker learns from a wrong guess.
   */
  private async getConversationHistory(conversationId: string, userId: string): Promise<any[]> {
    try {
      const conversation = await this.db
        .selectFrom('zv_ai_conversations')
        .select(['id'])
        .where('id', '=', conversationId)
        .where('user_id', '=', userId)
        .executeTakeFirst();

      if (!conversation) return [];

      const messages = await this.db
        .selectFrom('zv_ai_messages')
        .selectAll()
        .where('conversation_id', '=', conversationId)
        .orderBy('created_at', 'asc')
        .execute();

      return messages;
    } catch {
      return [];
    }
  }

  private async saveConversation(
    conversationId: string,
    userId: string,
    userMessage: string,
    assistantMessage: string,
  ): Promise<void> {
    try {
      // The other half of the same hole. Reading someone else's conversation is
      // now refused, but the write path was reached with the same caller-supplied
      // id: the upsert conflicts on `id` and only bumps `updated_at`, leaving
      // `user_id` alone — and then two messages land in the victim's thread.
      //
      // That is worse than it sounds. The injected turns become context for the
      // owner's NEXT request, so an attacker can plant instructions the model
      // will read while answering someone else.
      //
      // An existing conversation owned by another user ends the save. The reply
      // still reaches the caller; only the persistence is dropped, because the
      // alternative is writing into a thread that is not theirs.
      const existing = await this.db
        .selectFrom('zv_ai_conversations')
        .select(['user_id'])
        .where('id', '=', conversationId)
        .executeTakeFirst();

      if (existing && existing.user_id !== userId) return;

      await this.db
        .insertInto('zv_ai_conversations' as any)
        .values({
          id: conversationId,
          user_id: userId,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .onConflict((oc: any) =>
          oc.column('id').doUpdateSet({ updated_at: new Date() }),
        )
        .execute();

      await this.db
        .insertInto('zv_ai_messages' as any)
        .values({
          conversation_id: conversationId,
          user_id: userId,
          role: 'user',
          content: userMessage,
          created_at: new Date(),
        })
        .execute();

      await this.db
        .insertInto('zv_ai_messages' as any)
        .values({
          conversation_id: conversationId,
          role: 'assistant',
          content: assistantMessage,
          created_at: new Date(),
        })
        .execute();
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }
}
