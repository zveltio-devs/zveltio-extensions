// Names the action and the job share.

export const PROVIDERS = 'ai_providers';
export const TEMPLATES = 'ai_prompt_templates';
export const CONVERSATIONS = 'ai_conversations';
export const MESSAGES = 'ai_messages';
export const USAGE = 'ai_usage';

/** The egress slot the operator binds to the model providers' hosts (ADR 0026). */
export const SLOT = 'provider';

/** How many earlier messages of a conversation go to the model with a new one. */
export const HISTORY = 50;
