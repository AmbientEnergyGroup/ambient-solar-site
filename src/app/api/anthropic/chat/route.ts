import { createAnthropic } from "@ai-sdk/anthropic";
import { convertToCoreMessages, streamText } from "ai";
import { getNextApiKey } from "@/lib/apiKeyRotation";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Get the next API key in rotation
    const apiKey = getNextApiKey('anthropic');
    
    if (!apiKey) {
      throw new Error('No valid Anthropic API key found');
    }
    
    // Create Anthropic client with the API key directly
    const anthropicClient = createAnthropic({
      apiKey: apiKey, // Pass the API key directly, not relying on process.env
    });
    
    const result = await streamText({
      model: anthropicClient.messages("claude-3-5-sonnet-20240620"),
      messages: convertToCoreMessages(messages),
      system: "You are a helpful AI assistant",
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Anthropic API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
