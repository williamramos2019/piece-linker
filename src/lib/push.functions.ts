import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Public VAPID key — safe to ship to the browser. */
export const VAPID_PUBLIC_KEY =
  "BBNjbbxKCvo3t7kasQmkpfPW29YpUTTZAWaNxOpdCPY-Gwd7mQd3zS3imc6wl0xKJqRKc6sg_CQcJjFDJUneVCk";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  p256dh: z.string().min(1).max(500),
  auth: z.string().min(1).max(500),
  user_agent: z.string().max(400).optional(),
});

const notifySchema = z.object({
  product_name: z.string().trim().min(1).max(160),
  requester_name: z.string().trim().min(1).max(160),
  manufacturer: z.string().trim().max(160).optional(),
});

/** Stores (or refreshes) a browser push subscription. */
export const savePushSubscription = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => subscriptionSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert(
        {
          endpoint: data.endpoint,
          p256dh: data.p256dh,
          auth: data.auth,
          user_agent: data.user_agent ?? null,
        },
        { onConflict: "endpoint" },
      );

    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Sends a push notification to every registered device. */
export const notifyNewRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => notifySchema.parse(data))
  .handler(async ({ data }) => {
    const publicKey = process.env["VAPID_PUBLIC_KEY"];
    const privateKey = process.env["VAPID_PRIVATE_KEY"];
    if (!publicKey || !privateKey) {
      console.error("[push] VAPID keys are not configured");
      return { sent: 0 };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { buildPushPayload } = await import("@block65/webcrypto-web-push");

    const { data: subs, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth");

    if (error) {
      console.error(`[push] could not read subscriptions: ${error.message}`);
      return { sent: 0 };
    }
    if (!subs?.length) return { sent: 0 };

    const body = JSON.stringify({
      title: "Nova solicitação de cadastro",
      body: `${data.product_name}${data.manufacturer ? ` · ${data.manufacturer}` : ""} — enviada por ${data.requester_name}`,
      url: "/",
    });

    const vapid = { subject: "mailto:portal@linha-amarela.app", publicKey, privateKey };
    const stale: string[] = [];
    let sent = 0;

    await Promise.all(
      subs.map(async (sub) => {
        try {
          const payload = await buildPushPayload(
            { data: body, options: { ttl: 86400, urgency: "high" } },
            { endpoint: sub.endpoint, expirationTime: null, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            vapid,
          );
          const res = await fetch(sub.endpoint, payload);
          if (res.status === 404 || res.status === 410) {
            stale.push(sub.id);
            return;
          }
          if (!res.ok) {
            console.error(`[push] send failed [${res.status}]: ${await res.text()}`);
            return;
          }
          sent += 1;
        } catch (err) {
          console.error("[push] send error", err);
        }
      }),
    );

    if (stale.length) {
      await supabaseAdmin.from("push_subscriptions").delete().in("id", stale);
    }

    return { sent };
  });
