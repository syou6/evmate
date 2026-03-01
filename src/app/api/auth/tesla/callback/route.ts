import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getVehicles } from "@/lib/tesla";
import { setSession } from "@/lib/session";
import { createServerSupabase } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${appUrl}/?error=auth_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/?error=no_code`);
  }

  // Verify state (CSRF protection)
  const storedState = request.cookies.get("tesla_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${appUrl}/?error=invalid_state`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const db = createServerSupabase();

    // Decode JWT to extract Tesla user info (sub = tesla_user_id, email)
    const jwtPayload = decodeJwtPayload(tokens.access_token);
    const teslaUserId = jwtPayload?.sub ?? null;
    const email = jwtPayload?.email ?? null;

    // Upsert user in Supabase
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { data: user, error: upsertError } = await db
      .from("users")
      .upsert(
        {
          tesla_user_id: teslaUserId,
          email,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: tokenExpiresAt,
        },
        { onConflict: "tesla_user_id" }
      )
      .select("id")
      .single();

    if (upsertError || !user) {
      throw new Error(`Failed to upsert user: ${upsertError?.message}`);
    }

    // Fetch vehicles from Tesla API and save to DB
    try {
      const vehicles = await getVehicles(tokens.access_token);

      for (const vehicle of vehicles) {
        await db.from("vehicles").upsert(
          {
            user_id: user.id,
            tesla_vehicle_id: vehicle.id,
            vehicle_id: vehicle.vehicle_id,
            vin: vehicle.vin,
            display_name: vehicle.display_name,
            color: vehicle.color,
          },
          { onConflict: "vin" }
        );
      }
    } catch {
      // Non-fatal: vehicles can be fetched later
    }

    // Store session with user_id
    await setSession({ tokens, userId: user.id });

    const response = NextResponse.redirect(`${appUrl}/dashboard`);
    response.cookies.delete("tesla_oauth_state");
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`OAuth callback failed: ${message}`);
  }
}

/**
 * Decode JWT payload without verification (server already validated the token via Tesla OAuth).
 * Returns null if decoding fails.
 */
function decodeJwtPayload(token: string): Record<string, string> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64url").toString();
    return JSON.parse(payload);
  } catch {
    return null;
  }
}
