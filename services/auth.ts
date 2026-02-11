import { supabase } from "./supabase";
import { User, UserRole } from "../types";

/**
 * Authentication Service for Konark HRM
 * Handles database-backed authentication using Supabase RPC functions
 */

export interface LoginResponse {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Authenticate HR Administrator using email and password
 * Calls the hr_login() database function which:
 * - Verifies password using bcrypt
 * - Tracks failed login attempts
 * - Locks account after 5 failed attempts (15 minutes)
 * - Creates session token on success
 * - Logs all attempts to audit_logs
 */
export const authenticateHR = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  try {
    // Call the hr_login RPC function defined in database schema
    const { data, error } = await supabase.rpc("hr_login", {
      p_email: email,
      p_password: password,
      p_client_ip: null, // Could be enhanced to capture actual client IP
    });

    if (error) {
      console.error("Login RPC error:", error);
      return {
        success: false,
        error: "Database error occurred. Please try again.",
      };
    }

    // No data returned means invalid credentials or account locked
    if (!data || data.length === 0) {
      return {
        success: false,
        error:
          "Invalid credentials or account locked. Check your email/password or wait 15 minutes if locked.",
      };
    }

    // Successfully authenticated
    const userRecord = data[0];
    const user: User = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role as UserRole,
    };

    return { success: true, user };
  } catch (err) {
    console.error("Login exception:", err);
    return {
      success: false,
      error: "Unexpected error occurred. Please try again.",
    };
  }
};

/**
 * Validate if a user's session is still active
 * Checks hr_sessions table for unexpired, non-revoked tokens
 */
export const validateSession = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("hr_sessions")
      .select("expires_at, revoked_at")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .order("issued_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return false;

    // Check if session has expired
    const expiresAt = new Date(data.expires_at);
    return expiresAt > new Date();
  } catch {
    return false;
  }
};

/**
 * Revoke all active sessions for a user (logout from all devices)
 * Updates revoked_at timestamp on all non-revoked sessions
 */
export const revokeAllSessions = async (userId: string): Promise<void> => {
  try {
    await supabase
      .from("hr_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("revoked_at", null);
  } catch (err) {
    console.error("Error revoking sessions:", err);
  }
};

/**
 * Get active session count for a user
 * Useful for "active devices" display
 */
export const getActiveSessionCount = async (
  userId: string,
): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("hr_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString());

    return error ? 0 : count || 0;
  } catch {
    return 0;
  }
};

/**
 * Check if a user account is currently locked
 * Returns true if locked_until is in the future
 */
export const isAccountLocked = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("locked_until")
      .eq("email", email)
      .single();

    if (error || !data) return false;

    if (!data.locked_until) return false;

    const lockedUntil = new Date(data.locked_until);
    return lockedUntil > new Date();
  } catch {
    return false;
  }
};
