import { TeslaTokens, TeslaVehicle, VehicleData } from "@/types/tesla";

const TESLA_AUTH_URL =
  process.env.TESLA_AUTH_URL || "https://auth.tesla.com/oauth2/v3";
const TESLA_API_BASE =
  process.env.TESLA_API_BASE ||
  "https://fleet-api.prd.na.vn.cloud.tesla.com";
const TESLA_CLIENT_ID = process.env.TESLA_CLIENT_ID!;
const TESLA_CLIENT_SECRET = process.env.TESLA_CLIENT_SECRET!;

const VEHICLE_DATA_ENDPOINTS = [
  "charge_state",
  "drive_state",
  "vehicle_state",
  "climate_state",
  "location_data",
].join(";");

class TeslaApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "TeslaApiError";
  }
}

async function serverApiRequest<T>(
  accessToken: string,
  endpoint: string,
  method: string = "GET"
): Promise<T> {
  const res = await fetch(`${TESLA_API_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new TeslaApiError(
      `Tesla API error: ${res.status} ${error}`,
      res.status
    );
  }

  const data = await res.json();
  return data.response;
}

export async function fetchVehiclesList(
  accessToken: string
): Promise<TeslaVehicle[]> {
  return serverApiRequest<TeslaVehicle[]>(accessToken, "/api/1/vehicles");
}

export async function fetchVehicleData(
  accessToken: string,
  vehicleId: number
): Promise<VehicleData> {
  return serverApiRequest<VehicleData>(
    accessToken,
    `/api/1/vehicles/${vehicleId}/vehicle_data?endpoints=${VEHICLE_DATA_ENDPOINTS}`
  );
}

export async function refreshTokens(
  refreshToken: string
): Promise<TeslaTokens> {
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
    throw new TeslaApiError(
      `Tesla token refresh failed: ${res.status} ${error}`,
      res.status
    );
  }

  return res.json();
}

export { TeslaApiError };
