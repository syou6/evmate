import { NextResponse } from "next/server";
import { getTeslaAuthUrl } from "@/lib/tesla";
import { randomBytes } from "crypto";

export async function GET() {
  const state = randomBytes(16).toString("hex");

  // Store state in cookie for CSRF protection
  const authUrl = getTeslaAuthUrl(state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("tesla_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
