import { NextResponse } from "next/server";
import { getAccessToken, getUserId } from "@/lib/session";
import { getVehicles } from "@/lib/tesla";
import { createServerSupabase } from "@/lib/supabaseServer";

export async function GET() {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const vehicles = await getVehicles(accessToken);
    const userId = await getUserId();
    const db = createServerSupabase();

    if (userId) {
      for (const vehicle of vehicles) {
        await db.from("vehicles").upsert(
          {
            user_id: userId,
            tesla_vehicle_id: vehicle.id,
            vehicle_id: vehicle.vehicle_id,
            vin: vehicle.vin,
            display_name: vehicle.display_name,
            color: vehicle.color,
          },
          { onConflict: "vin" }
        );
      }
    }

    return NextResponse.json({ vehicles });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to fetch vehicles", detail: message }, { status: 500 });
  }
}
