import { NextResponse } from "next/server";

import { projectRepository } from "@/lib/repositories/projectRepository";

export async function GET() {
  try {
    const data = await projectRepository.findAll();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch projects.",
      },
      { status: 500 },
    );
  }
}
