import { ActionRefusal, type ExtensionAction } from '@zveltio/sdk/extension';
import { CONVERSATIONS, MESSAGES } from './ai.js';

// The engine runs the action as the caller, through the data API, in the
// request's transaction: a conversation the caller cannot read is not found.
// The model call is the `complete` job (`jobs.ts`); the caller reads the answer
// from `ai_messages` (realtime carries the change).

interface ChatInput {
  conversation_id: string;
  content: string;
}

const chat: ExtensionAction = async (input, host) => {
  const i = input as ChatInput;
  const conv = await host.collections.read(CONVERSATIONS, i.conversation_id);
  if (!conv) throw new ActionRefusal(404, 'conversation_not_found', 'No such conversation.');
  const busy = (await host.collections.list(MESSAGES, {
    filter: { conversation_id: { eq: conv.id }, status: { in: ['pending', 'running'] } },
    limit: 1,
    count: 'none',
  })) as { records?: unknown[] };
  if (busy.records?.length) {
    throw new ActionRefusal(409, 'answer_pending', 'The previous message is still being answered.');
  }
  await host.collections.insert(MESSAGES, { conversation_id: conv.id, role: 'user', content: i.content, status: 'done' });
  const answer = await host.collections.insert(MESSAGES, {
    conversation_id: conv.id,
    role: 'assistant',
    content: '',
    status: 'pending',
  });
  await host.enqueue('complete', { id: answer.id });
  return answer;
};

export const aiActions = { chat };
