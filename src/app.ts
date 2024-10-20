import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { PORT, AIEXPLAIN_API_KEY, ML_API_KEY, OPENAI_API_KEY } from './config.js'
import { serveStatic } from '@hono/node-server/serve-static'

const app = new Hono()
app.use('*', logger())

const systemPrompt = "You are a helpful field-service agent for a company. You can assist customers with scheduling appointments, answering questions about services, and providing basic troubleshooting."

app.use('/*', serveStatic({ root: './public' }))

async function stt(audioBuffer: Buffer): Promise<string> {
  console.log('Sending STT request to OpenAI...');
  try {
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'audio.wav');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    const result = await response.json();
    console.log('STT results:', result);

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${result.error?.message || 'Unknown error'}`);
    }

    console.log('STT response:', result.text);
    return result.text;
  } catch (error) {
    console.error('Error in STT:', error);
    throw error;
  }
}

async function tts(text: string): Promise<Buffer> {
  console.log('Sending TTS request to OpenAI...');
  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'alloy',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('TTS response received, length:', audioBuffer.byteLength);
    return Buffer.from(audioBuffer);
  } catch (error) {
    console.error('Error in TTS:', error);
    throw error;
  }
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
    
    // Get the raw body as ArrayBuffer
    const arrayBuffer = await c.req.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    console.log('Audio data received, length:', audioBuffer.length);

    const userInput = await stt(audioBuffer);
    console.log('User input:', userInput);

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userInput }
    ];

    const assistantResponse = await chatCompletion(messages);
    console.log('AI response:', assistantResponse);

    const audioResponse = await tts(assistantResponse || '');
    console.log('Audio response generated, length:', audioResponse.length);

    // Set the appropriate headers for audio output
    c.header('Content-Type', 'audio/mpeg'); // OpenAI returns audio in MP3 format
    c.header('Content-Length', audioResponse.length.toString());

    return c.body(audioResponse);
  } catch (error) {
    console.error('Error in chat:', error);
    if (error instanceof Error) {
      return c.json({ error: 'An error occurred during the conversation.', details: error.message }, 500);
    } else {
      return c.json({ error: 'An unknown error occurred during the conversation.' }, 500);
    }
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
  port: Number(PORT) || 3000
});
