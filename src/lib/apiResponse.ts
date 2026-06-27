import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T) {
  return NextResponse.json({
    success: true,
    data,
  });
}

export function apiError(error: unknown, statusCode = 500) {
  const message = error instanceof Error ? error.message : String(error);

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: statusCode },
  );
}
