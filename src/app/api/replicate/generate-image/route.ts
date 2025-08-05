import { NextResponse } from "next/server";
import Replicate from "replicate";
import { getNextApiKey } from "@/lib/apiKeyRotation";

// Create a function to get a configured Replicate client with the current API key
function getReplicateClient(): Replicate | null {
  const apiKey = getNextApiKey('replicate');
  
  if (!apiKey) {
    return null;
  }
  
  return new Replicate({
    auth: apiKey,
  });
}

export async function POST(request: Request) {
  // Get client with current API key from rotation
  const replicate = getReplicateClient();
  
  if (!replicate) {
    return NextResponse.json({ 
      error: "No valid Replicate API token found. See README.md for instructions on how to set it." 
    }, { status: 500 });
  }
  
  // Parse the request body outside try/catch to handle parsing errors separately
  let prompt;
  try {
    const body = await request.json();
    prompt = body.prompt;
  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Only wrap the actual API call in try/catch
  try {
    const output = await replicate.run(
      "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
      {
        input: {
          prompt: prompt,
          image_dimensions: "512x512",
          num_outputs: 1,
          num_inference_steps: 50,
          guidance_scale: 7.5,
          scheduler: "DPMSolverMultistep",
        },
      }
    );

    return NextResponse.json({ output }, { status: 200 });
  } catch (error) {
    console.error("Error from Replicate API:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
