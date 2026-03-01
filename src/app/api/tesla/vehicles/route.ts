import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/session";
import { getVehicles } from "@/lib/tesla";

export async function GET() {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const vehicles = await getVehicles(accessToken);
    return NextResponse.json({ vehicles });
  } catch (err) {
    console.error("Failed to get vehicles:", err);
    return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
  }
}
