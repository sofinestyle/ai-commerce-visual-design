import { NextResponse } from "next/server";

import { platformService } from "@/lib/services/platformService";

export async function GET() {
  try {
    const data = await platformService.getAll();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch platforms.",
      },
      { status: 500 },
    );
  }
}
