import { Message } from './openaiService.js';

export function createInitialResponse(): string {
  return JSON.stringify([
    { role: "system", content: "You are a helpful field-service agent for a company." },
    { role: "assistant", content: "Hello, how can I assist you today?" }
  ] as Message[]);
}

export function createGatherResponse(): string {
  return JSON.stringify({ action: 'gather', message: 'Waiting for user input...' });
}

export function createAssistantResponse(assistantResponse: string): string {
  return JSON.stringify({ action: 'speak', message: assistantResponse });
}

export function createEndCallResponse(message: string): string {
  return JSON.stringify({ action: 'end', message: message });
}
