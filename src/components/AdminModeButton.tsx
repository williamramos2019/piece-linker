import { useState } from "react";
import { KeyRound, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAsAdmin, signOutAdmin, useIsAdmin } from "@/lib/admin";

/** Password-only switch that unlocks the management controls. */
export function AdminModeButton() {
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  function handleConfirm() {
    if (!signInAsAdmin(password)) {
      toast.error("Senha incorreta.");
      return;
    }
    setPassword("");
    setOpen(false);
    toast.success("Modo administrador ativado.");
  }

  if (isAdmin) {
    return (
      <Button
        variant="outline"
        onClick={() => {
          signOutAdmin();
          toast.success("Modo administrador encerrado.");
        }}
      >
        <LogOut className="size-4" aria-hidden="true" />
        Sair do modo admin
      </Button>
    );
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <KeyRound className="size-4" aria-hidden="true" />
        Modo administrador
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Acesso do administrador</DialogTitle>
            <DialogDescription>
              Informe a senha para gerenciar status e código SAP das solicitações.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Senha</Label>
            <Input
              id="admin-password"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleConfirm}>Entrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
