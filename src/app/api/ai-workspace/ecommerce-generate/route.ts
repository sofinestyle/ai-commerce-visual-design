import { NextResponse } from "next/server";

import { apiError } from "@/lib/apiResponse";
import { runEcommerceImageGeneration } from "@/lib/ai-workspace/ecommerceGenerationOrchestrator";
import { requireUserApiResponse } from "@/lib/auth/requestAuth";

export async function POST(request: Request) {
  const authError = await requireUserApiResponse();

  if (authError) {
    return authError;
  }

  try {
    const body = await request.json();
    const data = await runEcommerceImageGeneration(body);
    const status = data.status === "needs_input" ? 400 : 200;

    return NextResponse.json(
      {
        success: data.status !== "needs_input",
        data,
      },
      { status },
    );
  } catch (error) {
    return apiError(error);
  }
}
