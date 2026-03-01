import { cookies } from "next/headers";
import { TeslaTokens } from "@/types/tesla";
import { refreshTeslaToken } from "./tesla";

const SESSION_COOKIE = "evmate_session";

interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id?: string;
}

interface SetSessionOptions {
  tokens: TeslaTokens;
  userId?: string;
}

/**
 * Store Tesla tokens in encrypted cookie
 */
export async function setSession({ tokens, userId }: SetSessionOptions): Promise<void> {
  const session: Session = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
    user_id: userId,
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, Buffer.from(JSON.stringify(session)).toString("base64"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

/**
 * Get current session, auto-refresh if expired
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);

  if (!cookie?.value) return null;

  try {
    const session: Session = JSON.parse(
      Buffer.from(cookie.value, "base64").toString()
    );

    // Token expired - refresh
    if (Date.now() >= session.expires_at - 60000) {
      const newTokens = await refreshTeslaToken(session.refresh_token);
      await setSession({ tokens: newTokens, userId: session.user_id });
      return {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: Date.now() + newTokens.expires_in * 1000,
        user_id: session.user_id,
      };
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Get access token or null
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}

/**
 * Get user ID from session or null
 */
export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user_id ?? null;
}

/**
 * Clear session
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
