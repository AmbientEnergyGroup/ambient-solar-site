import { createOpenAI } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";
import { getNextApiKey } from "@/lib/apiKeyRotation";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Get the next API key in rotation
    const apiKey = getNextApiKey('openai');
    
    if (!apiKey) {
      throw new Error('No valid OpenAI API key found');
    }
    
    // Create OpenAI client with the API key directly
    const openaiClient = createOpenAI({
      apiKey: apiKey,
    });
    
    const result = await streamText({
      model: openaiClient.chat("gpt-4o"),
      messages: convertToCoreMessages(messages),
      system: "You are a helpful AI assistant",
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('OpenAI API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
