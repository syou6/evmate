import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import {
  fetchVehicleData,
  refreshTokens,
  TeslaApiError,
} from "@/lib/teslaServer";
import { ChargeState, DriveState, VehicleState } from "@/types/tesla";
import { Json } from "@/types/database";

const MILES_TO_KM = 1.60934;

interface UserWithVehicles {
  id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string | null;
  vehicles: Array<{
    id: string;
    tesla_vehicle_id: number;
    display_name: string | null;
  }>;
}

interface CachedData {
  charge_state: ChargeState | null;
  drive_state: DriveState | null;
  vehicle_state: VehicleState | null;
  vehicle_status: string | null;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const results: Array<{ vehicleId: string; status: string; error?: string }> =
    [];

  try {
    const usersWithVehicles = await getUsersWithVehicles(supabase);

    for (const user of usersWithVehicles) {
      let accessToken = user.access_token;

      const tokenExpired = isTokenExpired(user.token_expires_at);
      if (tokenExpired) {
        const refreshed = await handleTokenRefresh(
          supabase,
          user.id,
          user.refresh_token
        );
        if (!refreshed) {
          for (const vehicle of user.vehicles) {
            results.push({
              vehicleId: vehicle.id,
              status: "skipped",
              error: "Token refresh failed",
            });
          }
          continue;
        }
        accessToken = refreshed;
      }

      for (const vehicle of user.vehicles) {
        try {
          const result = await processVehicle(
            supabase,
            accessToken,
            vehicle,
            user
          );
          results.push(result);
        } catch (error) {
          if (error instanceof TeslaApiError && error.status === 401) {
            const refreshed = await handleTokenRefresh(
              supabase,
              user.id,
              user.refresh_token
            );
            if (refreshed) {
              accessToken = refreshed;
              try {
                const retryResult = await processVehicle(
                  supabase,
                  accessToken,
                  vehicle,
                  user
                );
                results.push(retryResult);
                continue;
              } catch {
                // Fall through to error handler below
              }
            }
          }
          results.push({
            vehicleId: vehicle.id,
            status: "error",
            error:
              error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    processed: results.length,
    results,
  });
}

async function getUsersWithVehicles(
  supabase: ReturnType<typeof createServerSupabase>
): Promise<UserWithVehicles[]> {
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, access_token, refresh_token, token_expires_at")
    .not("access_token", "is", null)
    .not("refresh_token", "is", null);

  if (usersError) {
    throw new Error(`Failed to fetch users: ${usersError.message}`);
  }

  if (!users || users.length === 0) {
    return [];
  }

  const usersWithVehicles: UserWithVehicles[] = [];

  for (const user of users) {
    const { data: vehicles, error: vehiclesError } = await supabase
      .from("vehicles")
      .select("id, tesla_vehicle_id, display_name")
      .eq("user_id", user.id);

    if (vehiclesError || !vehicles || vehicles.length === 0) {
      continue;
    }

    usersWithVehicles.push({
      id: user.id,
      access_token: user.access_token!,
      refresh_token: user.refresh_token!,
      token_expires_at: user.token_expires_at,
      vehicles,
    });
  }

  return usersWithVehicles;
}

function isTokenExpired(tokenExpiresAt: string | null): boolean {
  if (!tokenExpiresAt) return false;
  const expiresAt = new Date(tokenExpiresAt).getTime();
  return Date.now() >= expiresAt - 60_000;
}

async function handleTokenRefresh(
  supabase: ReturnType<typeof createServerSupabase>,
  userId: string,
  refreshToken: string
): Promise<string | null> {
  try {
    const newTokens = await refreshTokens(refreshToken);
    const tokenExpiresAt = new Date(
      Date.now() + newTokens.expires_in * 1000
    ).toISOString();

    const { error } = await supabase
      .from("users")
      .update({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        token_expires_at: tokenExpiresAt,
      })
      .eq("id", userId);

    if (error) {
      return null;
    }

    return newTokens.access_token;
  } catch {
    return null;
  }
}

async function processVehicle(
  supabase: ReturnType<typeof createServerSupabase>,
  accessToken: string,
  vehicle: { id: string; tesla_vehicle_id: number; display_name: string | null },
  user: UserWithVehicles
): Promise<{ vehicleId: string; status: string; error?: string }> {
  const previousCache = await getPreviousCache(supabase, vehicle.id);

  let vehicleData;
  try {
    vehicleData = await fetchVehicleData(
      accessToken,
      vehicle.tesla_vehicle_id
    );
  } catch (error) {
    if (
      error instanceof TeslaApiError &&
      (error.status === 408 || error.status === 504)
    ) {
      await upsertCache(supabase, vehicle.id, {
        charge_state: null,
        drive_state: null,
        vehicle_state: null,
        climate_state: null,
        vehicle_status: "asleep",
      });
      return { vehicleId: vehicle.id, status: "asleep" };
    }
    throw error;
  }

  await upsertCache(supabase, vehicle.id, {
    charge_state: vehicleData.charge_state as unknown as Json,
    drive_state: vehicleData.drive_state as unknown as Json,
    vehicle_state: vehicleData.vehicle_state as unknown as Json,
    climate_state: vehicleData.climate_state as unknown as Json,
    vehicle_status: "online",
  });

  await detectChargingSession(
    supabase,
    vehicle.id,
    vehicleData.charge_state,
    vehicleData.drive_state,
    previousCache
  );

  await detectDrivingTrip(
    supabase,
    vehicle.id,
    vehicleData.drive_state,
    vehicleData.vehicle_state,
    vehicleData.charge_state,
    previousCache
  );

  return { vehicleId: vehicle.id, status: "collected" };
}

async function getPreviousCache(
  supabase: ReturnType<typeof createServerSupabase>,
  vehicleId: string
): Promise<CachedData | null> {
  const { data } = await supabase
    .from("vehicle_data_cache")
    .select("charge_state, drive_state, vehicle_state, vehicle_status")
    .eq("vehicle_id", vehicleId)
    .single();

  if (!data) return null;

  return {
    charge_state: data.charge_state as unknown as ChargeState | null,
    drive_state: data.drive_state as unknown as DriveState | null,
    vehicle_state: data.vehicle_state as unknown as VehicleState | null,
    vehicle_status: data.vehicle_status,
  };
}

async function upsertCache(
  supabase: ReturnType<typeof createServerSupabase>,
  vehicleId: string,
  data: {
    charge_state: Json | null;
    drive_state: Json | null;
    vehicle_state: Json | null;
    climate_state: Json | null;
    vehicle_status: string;
  }
): Promise<void> {
  const row = {
    vehicle_id: vehicleId,
    charge_state: data.charge_state,
    drive_state: data.drive_state,
    vehicle_state: data.vehicle_state,
    climate_state: data.climate_state,
    vehicle_status: data.vehicle_status,
    fetched_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("vehicle_data_cache")
    .upsert(row, { onConflict: "vehicle_id" });

  if (error) {
    throw new Error(`Failed to upsert cache: ${error.message}`);
  }
}

async function detectChargingSession(
  supabase: ReturnType<typeof createServerSupabase>,
  vehicleId: string,
  currentCharge: ChargeState,
  currentDrive: DriveState,
  previousCache: CachedData | null
): Promise<void> {
  const currentChargingState = currentCharge.charging_state;
  const previousChargingState = previousCache?.charge_state?.charging_state;

  const startedCharging =
    currentChargingState === "Charging" &&
    previousChargingState !== "Charging";

  const stoppedCharging =
    currentChargingState !== "Charging" &&
    previousChargingState === "Charging";

  if (startedCharging) {
    const { error } = await supabase.from("charging_sessions").insert({
      vehicle_id: vehicleId,
      started_at: new Date().toISOString(),
      start_battery_level: currentCharge.battery_level,
      charger_power_max_kw: currentCharge.charger_power,
      charge_rate_avg_kw: currentCharge.charger_power,
      location_lat: currentDrive.latitude,
      location_lng: currentDrive.longitude,
      is_active: true,
    });

    if (error) {
      throw new Error(
        `Failed to create charging session: ${error.message}`
      );
    }
  }

  if (stoppedCharging) {
    const { data: activeSession } = await supabase
      .from("charging_sessions")
      .select("id, start_battery_level, charger_power_max_kw")
      .eq("vehicle_id", vehicleId)
      .eq("is_active", true)
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (activeSession) {
      const { error } = await supabase
        .from("charging_sessions")
        .update({
          ended_at: new Date().toISOString(),
          end_battery_level: currentCharge.battery_level,
          energy_added_kwh: currentCharge.charge_energy_added,
          charger_power_max_kw: Math.max(
            activeSession.charger_power_max_kw ?? 0,
            currentCharge.charger_power
          ),
          is_active: false,
        })
        .eq("id", activeSession.id);

      if (error) {
        throw new Error(
          `Failed to close charging session: ${error.message}`
        );
      }
    }
  }

  if (currentChargingState === "Charging") {
    const { data: activeSession } = await supabase
      .from("charging_sessions")
      .select("id, charger_power_max_kw")
      .eq("vehicle_id", vehicleId)
      .eq("is_active", true)
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (activeSession) {
      const maxPower = Math.max(
        activeSession.charger_power_max_kw ?? 0,
        currentCharge.charger_power
      );

      await supabase
        .from("charging_sessions")
        .update({ charger_power_max_kw: maxPower })
        .eq("id", activeSession.id);
    }
  }
}

async function detectDrivingTrip(
  supabase: ReturnType<typeof createServerSupabase>,
  vehicleId: string,
  currentDrive: DriveState,
  currentVehicleState: VehicleState,
  currentCharge: ChargeState,
  previousCache: CachedData | null
): Promise<void> {
  const currentSpeed = currentDrive.speed;
  const previousSpeed = previousCache?.drive_state?.speed ?? null;

  const startedDriving =
    currentSpeed !== null && currentSpeed > 0 && previousSpeed === null;

  const stoppedDriving =
    currentSpeed === null && previousSpeed !== null && previousSpeed > 0;

  if (startedDriving) {
    const odometerKm = currentVehicleState.odometer * MILES_TO_KM;

    const { error } = await supabase.from("driving_trips").insert({
      vehicle_id: vehicleId,
      started_at: new Date().toISOString(),
      start_battery_level: currentCharge.battery_level,
      start_odometer_km: Math.round(odometerKm * 10) / 10,
      start_lat: currentDrive.latitude,
      start_lng: currentDrive.longitude,
      max_speed_kmh: Math.round(currentSpeed * MILES_TO_KM * 10) / 10,
      is_active: true,
    });

    if (error) {
      throw new Error(`Failed to create driving trip: ${error.message}`);
    }
  }

  if (stoppedDriving) {
    const { data: activeTrip } = await supabase
      .from("driving_trips")
      .select(
        "id, start_battery_level, start_odometer_km, started_at, max_speed_kmh"
      )
      .eq("vehicle_id", vehicleId)
      .eq("is_active", true)
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (activeTrip) {
      const endOdometerKm = currentVehicleState.odometer * MILES_TO_KM;
      const distanceKm =
        Math.round(
          (endOdometerKm - (activeTrip.start_odometer_km ?? 0)) * 10
        ) / 10;
      const endBattery = currentCharge.battery_level;
      const batteryDiff =
        (activeTrip.start_battery_level ?? 0) - endBattery;

      const estimatedCapacityKwh = 75;
      const energyUsedKwh =
        Math.round(
          (batteryDiff / 100) * estimatedCapacityKwh * 100
        ) / 100;

      const efficiencyWhPerKm =
        distanceKm > 0
          ? Math.round((energyUsedKwh * 1000) / distanceKm)
          : null;

      const startedAt = new Date(activeTrip.started_at).getTime();
      const endedAt = Date.now();
      const durationHours = (endedAt - startedAt) / (1000 * 60 * 60);
      const avgSpeedKmh =
        durationHours > 0
          ? Math.round((distanceKm / durationHours) * 10) / 10
          : null;

      const { error } = await supabase
        .from("driving_trips")
        .update({
          ended_at: new Date().toISOString(),
          end_battery_level: endBattery,
          end_odometer_km: Math.round(endOdometerKm * 10) / 10,
          end_lat: currentDrive.latitude,
          end_lng: currentDrive.longitude,
          distance_km: distanceKm,
          energy_used_kwh: energyUsedKwh,
          efficiency_wh_per_km: efficiencyWhPerKm,
          avg_speed_kmh: avgSpeedKmh,
          max_speed_kmh: activeTrip.max_speed_kmh ?? 0,
          is_active: false,
        })
        .eq("id", activeTrip.id);

      if (error) {
        throw new Error(`Failed to close driving trip: ${error.message}`);
      }
    }
  }

  if (currentSpeed !== null && currentSpeed > 0) {
    const { data: activeTrip } = await supabase
      .from("driving_trips")
      .select("id, max_speed_kmh")
      .eq("vehicle_id", vehicleId)
      .eq("is_active", true)
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (activeTrip) {
      const currentSpeedKmh = currentSpeed * MILES_TO_KM;
      const maxSpeed = Math.max(
        activeTrip.max_speed_kmh ?? 0,
        Math.round(currentSpeedKmh * 10) / 10
      );

      await supabase
        .from("driving_trips")
        .update({ max_speed_kmh: maxSpeed })
        .eq("id", activeTrip.id);
    }
  }
}
