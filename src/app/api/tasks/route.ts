import { NextResponse } from "next/server";

import { taskRepository } from "@/lib/repositories/taskRepository";

export async function GET() {
  try {
    const data = await taskRepository.findAll();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch tasks.",
      },
      { status: 500 },
    );
  }
}
