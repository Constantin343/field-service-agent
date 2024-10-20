import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { PORT, ML_API_KEY } from './config.js'

const app = new Hono()
app.use('*', logger())

const systemPrompt = "You are a helpful field-service agent for a company. You can assist customers with scheduling appointments, answering questions about services, and providing basic troubleshooting."

async function stt(audioData: string): Promise<string> {
  console.log('Sending STT request...');
  const response = await fetch('https://api.aimlapi.com/stt', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ML_API_KEY}`
    },
    body: JSON.stringify({
      "model": "text",
      "audio": audioData
    }),
  });
  const data = await response.json();
  console.log('STT response:', data);
  return data.text;
}

async function tts(text: string): Promise<string> {
  console.log('Sending TTS request...');
  const response = await fetch('https://api.aimlapi.com/tts', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ML_API_KEY}`
    },
    body: JSON.stringify({
      "model": "text",
      "text": text
    }),
  });
  const data = await response.json();
  console.log('TTS response:', data);
  return data.audio;
}

async function chatCompletion(messages: Array<{role: string, content: string}>): Promise<string> {
  console.log('Sending chat completion request...');
  const response = await fetch("https://api.aimlapi.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ML_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 512,
      stream: false,
    }),
  });
  const data = await response.json();
  console.log('Chat completion response:', data);
  return data.choices[0].message.content;
}

app.post('/chat', async (c) => {
  try {
    console.log('Received chat request');
    const { audio } = await c.req.json();
    console.log('Audio data received, length:', audio.length);

    const userInput = await stt(audio);
    console.log('User input:', userInput);

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userInput }
    ];

    const assistantResponse = await chatCompletion(messages);
    console.log('AI response:', assistantResponse);

    const audioResponse = await tts(assistantResponse || '');
    console.log('Audio response generated, length:', audioResponse.length);

    return c.json({ 
      text: assistantResponse,
      audio: audioResponse
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return c.json({ error: 'An error occurred during the conversation.' }, 500);
  }
});

app.post('/test-completion', async (c) => {
  try {
    console.log('Received test-completion request');
    const { prompt } = await c.req.json();
    console.log('User prompt:', prompt);

    const messages = [
      { role: "system", content: "You are a travel agent. Be descriptive and helpful" },
      { role: "user", content: prompt }
    ];

    console.log('Sending request to AI...');
    console.log('API Key:', ML_API_KEY?.substring(0, 5) + '...');  // Log first 5 characters of API key
    const response = await chatCompletion(messages);
    console.log("AI response:", response);

    return c.json({ response });
  } catch (error) {
    console.error('Error in test-completion:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    return c.json({ error: 'An error occurred during the test completion.' }, 500);
  }
});

console.log(`Server is starting on port ${PORT}`);

serve({
  fetch: app.fetch,
  port: PORT
});
