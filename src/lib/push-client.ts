import { VAPID_PUBLIC_KEY, savePushSubscription } from "./push.functions";

export type EnablePushResult =
  | "registered"
  | "unsupported"
  | "open-in-new-tab"
  | "denied"
  | "error";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalized);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function encodeKey(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Registers the service worker and subscribes this browser to push notifications. */
export async function enablePush(): Promise<EnablePushResult> {
  if (typeof window === "undefined") return "error";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported";
  }
  if (window.top !== window.self) return "open-in-new-tab";

  try {
    const permission =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();
    if (permission !== "granted") return "denied";

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    await savePushSubscription({
      data: {
        endpoint: subscription.endpoint,
        p256dh: encodeKey(subscription.getKey("p256dh")),
        auth: encodeKey(subscription.getKey("auth")),
        user_agent: navigator.userAgent.slice(0, 400),
      },
    });

    return "registered";
  } catch (err) {
    console.error("[push] enable failed", err);
    return "error";
  }
}

/** True when this browser already has an active push subscription. */
export async function hasPushSubscription(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
  if (Notification?.permission !== "granted") return false;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = await registration?.pushManager.getSubscription();
  return Boolean(sub);
}
