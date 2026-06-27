import { NextResponse } from "next/server";

import { brandRepository } from "@/lib/repositories/brandRepository";

export async function GET() {
  try {
    const data = await brandRepository.findAll();

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
