import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export const localOllama = createOpenAICompatible({
  name: 'ollama',
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'not-required',
});

export const OLLAMA_MODEL = 'gpt-oss:20b';