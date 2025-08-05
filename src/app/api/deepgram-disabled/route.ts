import { NextResponse } from "next/server";
import { getNextApiKey } from "@/lib/apiKeyRotation";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Get the next API key in rotation
        const apiKey = getNextApiKey('deepgram');
        
        return NextResponse.json({
            key: apiKey,
        });
    } catch (error) {
        console.error("Error getting Deepgram API key:", error);
        return NextResponse.json({ error: "Failed to get API key" }, { status: 500 });
    }
}
