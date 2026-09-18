import { useSyncExternalStore } from "react";

/**
 * Lightweight admin gate: no user accounts, no login screen.
 * The manager types a shared password once and the browser remembers it.
 * This only controls what the UI offers — it is not a security boundary.
 */
const STORAGE_KEY = "portal-admin";
const ADMIN_PASSWORD = "153020";

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Server render never has admin mode on. */
function getServerSnapshot(): boolean {
  return false;
}

export function useIsAdmin(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Returns true when the password matches and admin mode was enabled. */
export function signInAsAdmin(password: string): boolean {
  if (password.trim() !== ADMIN_PASSWORD) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    return false;
  }
  emit();
  return true;
}

export function signOutAdmin(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable — nothing to clear */
  }
  emit();
}
