// @bun
// /zveltio-extension/packages/sdk/src/extension/action-refusal.ts
var ACTION_REFUSAL = Symbol.for("zveltio.extension.action-refusal");

class ActionRefusal extends Error {
  status;
  code;
  [ACTION_REFUSAL] = true;
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ActionRefusal";
  }
}
// /zveltio-extension/packages/sdk/src/extension/reserved-paths.ts
var RESERVED_PATH_SEGMENTS = Object.freeze([
  "api",
  "ext",
  "admin",
  "app",
  "auth",
  "_app",
  "_server",
  ".well-known",
  "robots.txt",
  "sitemap.xml"
]);
// engine/ai.ts
var CONVERSATIONS = "ai_conversations";
var MESSAGES = "ai_messages";

// engine/actions.ts
var chat = async (input, host) => {
  const i = input;
  const conv = await host.collections.read(CONVERSATIONS, i.conversation_id);
  if (!conv)
    throw new ActionRefusal(404, "conversation_not_found", "No such conversation.");
  const busy = await host.collections.list(MESSAGES, {
    filter: { conversation_id: { eq: conv.id }, status: { in: ["pending", "running"] } },
    limit: 1,
    count: "none"
  });
  if (busy.records?.length) {
    throw new ActionRefusal(409, "answer_pending", "The previous message is still being answered.");
  }
  await host.collections.insert(MESSAGES, { conversation_id: conv.id, role: "user", content: i.content, status: "done" });
  const answer = await host.collections.insert(MESSAGES, {
    conversation_id: conv.id,
    role: "assistant",
    content: "",
    status: "pending"
  });
  await host.enqueue("complete", { id: answer.id });
  return answer;
};
var aiActions = { chat };

// engine/index.ts
var extension = {
  name: "ai",
  category: "intelligence",
  mountStrategy: "subapp",
  actions: aiActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
