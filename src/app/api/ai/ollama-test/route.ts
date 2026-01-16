

import { streamText } from 'ai';
import { localOllama, OLLAMA_MODEL } from '@/lib/localOllama';

export async function GET() {
  const result = streamText({
    model: localOllama(OLLAMA_MODEL),
    messages: [
      { role: 'system', content: 'You are a helpful senior Ollama assistant.' },
      { role: 'user', content: 'Explain what Ollama is and how it works in one concise paragraph.' },
    ],
  });
  return result.toTextStreamResponse();
}
