import { TeslaTokens, TeslaVehicle, VehicleData } from "@/types/tesla";

const TESLA_AUTH_URL = process.env.TESLA_AUTH_URL || "https://auth.tesla.com/oauth2/v3";
const TESLA_API_BASE = process.env.TESLA_API_BASE || "https://fleet-api.prd.na.vn.cloud.tesla.com";
const TESLA_CLIENT_ID = process.env.TESLA_CLIENT_ID!;
const TESLA_CLIENT_SECRET = process.env.TESLA_CLIENT_SECRET!;
const TESLA_REDIRECT_URI = process.env.TESLA_REDIRECT_URI!;
const TESLA_AUDIENCE = process.env.TESLA_AUDIENCE || TESLA_API_BASE;

// Scopes we request
const SCOPES = [
  "openid",
  "email",
  "offline_access",
  "vehicle_device_data",
  "vehicle_location",
];

/**
 * Generate Tesla OAuth authorization URL
 */
export function getTeslaAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: TESLA_CLIENT_ID,
    redirect_uri: TESLA_REDIRECT_URI,
    scope: SCOPES.join(" "),
    state,
    audience: TESLA_AUDIENCE,
  });
  return `${TESLA_AUTH_URL}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<TeslaTokens> {
  const res = await fetch(`${TESLA_AUTH_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: TESLA_CLIENT_ID,
      client_secret: TESLA_CLIENT_SECRET,
      code,
      redirect_uri: TESLA_REDIRECT_URI,
      audience: TESLA_AUDIENCE,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Tesla token exchange failed: ${res.status} ${error}`);
  }

  return res.json();
}

/**
 * Refresh access token
 */
export async function refreshTeslaToken(refreshToken: string): Promise<TeslaTokens> {
  const res = await fetch(`${TESLA_AUTH_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: TESLA_CLIENT_ID,
      client_secret: TESLA_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Tesla token refresh failed: ${res.status} ${error}`);
  }

  return res.json();
}

/**
 * Make authenticated request to Tesla Fleet API
 */
async function teslaApiRequest<T>(
  accessToken: string,
  endpoint: string,
  method: string = "GET",
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${TESLA_API_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Tesla API error: ${res.status} ${error}`);
  }

  const data = await res.json();
  return data.response;
}

/**
 * Get list of vehicles
 */
export async function getVehicles(accessToken: string): Promise<TeslaVehicle[]> {
  return teslaApiRequest<TeslaVehicle[]>(accessToken, "/api/1/vehicles");
}

/**
 * Get detailed vehicle data
 */
export async function getVehicleData(
  accessToken: string,
  vehicleId: number
): Promise<VehicleData> {
  const endpoints = [
    "charge_state",
    "drive_state",
    "vehicle_state",
    "climate_state",
    "location_data",
  ].join(";");

  return teslaApiRequest<VehicleData>(
    accessToken,
    `/api/1/vehicles/${vehicleId}/vehicle_data?endpoints=${endpoints}`
  );
}

/**
 * Wake up vehicle
 */
export async function wakeUpVehicle(
  accessToken: string,
  vehicleId: number
): Promise<{ state: string }> {
  return teslaApiRequest<{ state: string }>(
    accessToken,
    `/api/1/vehicles/${vehicleId}/wake_up`,
    "POST"
  );
}

/**
 * Convert miles to km
 */
export function milesToKm(miles: number): number {
  return Math.round(miles * 1.60934 * 10) / 10;
}

/**
 * Convert F to C
 */
export function fahrenheitToCelsius(f: number): number {
  return Math.round(((f - 32) * 5) / 9 * 10) / 10;
}
