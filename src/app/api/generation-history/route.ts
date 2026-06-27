import { NextResponse } from "next/server";

import { generationHistoryRepository } from "@/lib/repositories/generationHistoryRepository";

export async function GET() {
  try {
    const data = await generationHistoryRepository.findAll();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch generation history.",
      },
      { status: 500 },
    );
  }
}
