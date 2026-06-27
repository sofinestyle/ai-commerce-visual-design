import { NextResponse } from "next/server";

import { projectService } from "@/lib/services/projectService";

export async function GET() {
  try {
    const data = await projectService.getAll();

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
