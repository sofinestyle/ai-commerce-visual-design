import { NextResponse } from "next/server";

import { brandService } from "@/lib/services/brandService";

export async function GET() {
  try {
    const data = await brandService.getAll();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch brands.",
      },
      { status: 500 },
    );
  }
}
