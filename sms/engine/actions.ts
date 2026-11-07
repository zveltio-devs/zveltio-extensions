import { ActionRefusal, type ExtensionAction } from '@zveltio/sdk/extension';
import { MESSAGES, TEMPLATES, interpolate } from './sms.js';

// The engine runs the action as the caller, through the data API, in the
// request's transaction. The provider call is the `deliver` job (`jobs.ts`):
// the action records the message as `pending` and queues it.

interface SendInput {
  provider?: 'twilio' | 'vonage';
  to: string;
  body?: string;
  template_id?: string;
  variables?: Record<string, string>;
}

const send: ExtensionAction = async (input, host) => {
  const i = input as SendInput;
  let body = i.body?.trim() ? i.body : '';
  let provider = i.provider;
  // The Studio form sends an untouched relation as an empty string.
  if (i.template_id) {
    const t = await host.collections.read(TEMPLATES, i.template_id);
    if (!t) throw new ActionRefusal(404, 'template_not_found', 'No such SMS template.');
    body = interpolate(String(t.body), i.variables ?? {});
    provider ??= t.provider as SendInput['provider'];
  }
  if (!body) throw new ActionRefusal(422, 'body_required', 'Write the message or pick a template.');
  const message = await host.collections.insert(MESSAGES, {
    provider: provider ?? 'twilio',
    to_number: i.to,
    body,
    status: 'pending',
  });
  await host.enqueue('deliver', { id: message.id });
  return message;
};

export const smsActions = { send };
