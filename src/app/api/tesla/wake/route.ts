import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/session";
import { wakeUpVehicle } from "@/lib/tesla";

export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { vehicle_id?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.vehicle_id) {
    return NextResponse.json({ error: "vehicle_id is required" }, { status: 400 });
  }

  try {
    const result = await wakeUpVehicle(accessToken, body.vehicle_id);
    return NextResponse.json({ state: result.state });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to wake vehicle: ${message}`);
  }
}
