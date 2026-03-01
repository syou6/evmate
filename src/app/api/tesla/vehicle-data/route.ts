import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/session";
import { getVehicleData } from "@/lib/tesla";
import { createServerSupabase } from "@/lib/supabaseServer";
import { Json } from "@/types/database";

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export async function GET(request: NextRequest) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const vehicleId = request.nextUrl.searchParams.get("id");
  if (!vehicleId) {
    return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 });
  }

  const db = createServerSupabase();

  // Look up the vehicle's DB record by tesla_vehicle_id
  const { data: vehicle } = await db
    .from("vehicles")
    .select("id")
    .eq("tesla_vehicle_id", parseInt(vehicleId))
    .single();

  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  // Check cache
  const { data: cached } = await db
    .from("vehicle_data_cache")
    .select("*")
    .eq("vehicle_id", vehicle.id)
    .single();

  if (cached?.fetched_at) {
    const cacheAge = Date.now() - new Date(cached.fetched_at).getTime();
    if (cacheAge < CACHE_TTL_MS) {
      return NextResponse.json({
        data: buildResponseFromCache(cached),
        cached: true,
        cachedAt: cached.fetched_at,
      });
    }
  }

  // Cache is stale or missing - fetch fresh data from Tesla API
  try {
    const data = await getVehicleData(accessToken, parseInt(vehicleId));

    // Update cache
    const cachePayload = {
      vehicle_id: vehicle.id,
      charge_state: data.charge_state as unknown as Json,
      drive_state: data.drive_state as unknown as Json,
      vehicle_state: data.vehicle_state as unknown as Json,
      climate_state: data.climate_state as unknown as Json,
      vehicle_status: data.state,
      fetched_at: new Date().toISOString(),
    };
    await db
      .from("vehicle_data_cache")
      .upsert(cachePayload, { onConflict: "vehicle_id" });

    return NextResponse.json({ data, cached: false });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Vehicle asleep or unavailable - return cached data, do NOT auto wake
    if (errorMessage.includes("408") || errorMessage.includes("vehicle unavailable")) {
      if (cached) {
        return NextResponse.json({
          data: buildResponseFromCache(cached),
          cached: true,
          vehicleAsleep: true,
          cachedAt: cached.fetched_at,
        });
      }

      return NextResponse.json(
        { error: "Vehicle is asleep and no cached data available", vehicleAsleep: true },
        { status: 503 }
      );
    }

    throw new Error(`Failed to fetch vehicle data: ${errorMessage}`);
  }
}

function buildResponseFromCache(cached: {
  charge_state: unknown;
  drive_state: unknown;
  vehicle_state: unknown;
  climate_state: unknown;
  vehicle_status: string | null;
}) {
  return {
    charge_state: cached.charge_state,
    drive_state: cached.drive_state,
    vehicle_state: cached.vehicle_state,
    climate_state: cached.climate_state,
    state: cached.vehicle_status,
  };
}
