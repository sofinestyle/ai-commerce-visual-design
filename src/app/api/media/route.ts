import { NextResponse } from "next/server";

import { mediaRepository } from "@/lib/repositories/mediaRepository";

export async function GET() {
  try {
    const data = await mediaRepository.findAll();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch media.",
      },
      { status: 500 },
    );
  }
}
