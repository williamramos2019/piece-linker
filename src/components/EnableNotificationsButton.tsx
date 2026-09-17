import { useEffect, useState } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { enablePush, hasPushSubscription } from "@/lib/push-client";

/** Lets the person responsible for the SAP registration receive push alerts. */
export function EnableNotificationsButton() {
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void hasPushSubscription().then(setActive);
  }, []);

  async function handleClick() {
    setBusy(true);
    const result = await enablePush();
    setBusy(false);

    if (result === "registered") {
      setActive(true);
      toast.success("Avisos ativados neste aparelho.");
      return;
    }
    if (result === "open-in-new-tab") {
      toast.info("Abra o portal em uma aba própria (ou pelo app instalado) para ativar os avisos.");
      return;
    }
    if (result === "denied") {
      toast.error("Permissão negada. Libere as notificações nas configurações do navegador.");
      return;
    }
    if (result === "unsupported") {
      toast.error("Este navegador não suporta notificações.");
      return;
    }
    toast.error("Não foi possível ativar os avisos. Tente novamente.");
  }

  return (
    <Button
      type="button"
      variant={active ? "secondary" : "outline"}
      size="lg"
      onClick={handleClick}
      disabled={busy || active}
      aria-label={active ? "Avisos ativados neste aparelho" : "Ativar avisos de novas solicitações"}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : active ? (
        <BellRing className="size-4" aria-hidden="true" />
      ) : (
        <Bell className="size-4" aria-hidden="true" />
      )}
      {active ? "Avisos ativados" : "Ativar avisos"}
    </Button>
  );
}
