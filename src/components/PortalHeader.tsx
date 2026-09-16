import { Link } from "@tanstack/react-router";
import { HardHat } from "lucide-react";

/** Top bar shared by every screen of the portal. */
export function PortalHeader() {
  return (
    <header className="border-b border-border bg-accent">
      <div className="hazard-stripe h-1.5 w-full" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <HardHat className="size-5" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold tracking-tight text-accent-foreground">
              Portal Linha Amarela
            </span>
            <span className="block text-xs text-accent-foreground/60">
              Cadastro de peças e produtos
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}
