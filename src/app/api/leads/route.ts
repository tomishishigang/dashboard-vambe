import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/lead-service";

export async function GET() {
  try {
    const data = getDashboardData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to load dashboard data:", err);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 },
    );
  }
}
