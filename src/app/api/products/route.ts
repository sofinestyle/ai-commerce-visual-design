import { NextResponse } from "next/server";

import { productRepository } from "@/lib/repositories/productRepository";

export async function GET() {
  try {
    const data = await productRepository.findAll();

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
