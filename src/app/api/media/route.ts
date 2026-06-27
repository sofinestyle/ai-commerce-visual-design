import { NextResponse } from "next/server";

import { mediaService } from "@/lib/services/mediaService";

export async function GET() {
  try {
    const data = await mediaService.getAll();

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
