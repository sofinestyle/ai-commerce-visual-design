import { NextResponse } from "next/server";

import { productService } from "@/lib/services/productService";

export async function GET() {
  try {
    const data = await productService.getAll();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch products.",
      },
      { status: 500 },
    );
  }
}
