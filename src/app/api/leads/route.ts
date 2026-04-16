import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/lead-service";

export async function GET() {
  const data = getDashboardData();
  return NextResponse.json(data);
}
