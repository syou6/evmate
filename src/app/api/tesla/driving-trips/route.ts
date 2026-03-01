import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createServerSupabase } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session?.user_id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const vehicleId = request.nextUrl.searchParams.get("vehicle_id");
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get("limit") ?? "10"),
    50
  );

  const db = createServerSupabase();

  let query = db
    .from("driving_trips")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (vehicleId) {
    query = query.eq("vehicle_id", vehicleId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch driving trips: ${error.message}`);
  }

  return NextResponse.json({ trips: data ?? [] });
}
