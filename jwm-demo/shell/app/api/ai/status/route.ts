import { NextResponse } from "next/server";
import { liteLLMConfigured, LITELLM_MODEL } from "@/lib/litellm";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    live: liteLLMConfigured(),
    model: liteLLMConfigured() ? LITELLM_MODEL : null,
  });
}
