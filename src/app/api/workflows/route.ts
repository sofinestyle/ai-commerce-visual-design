import { NextResponse } from "next/server";

import { workflowService } from "@/lib/services/workflowService";

export async function GET() {
  try {
    const data = await workflowService.getAll();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch workflows.",
      },
      { status: 500 },
    );
  }
}
