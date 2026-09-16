import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";

import { PortalHeader } from "@/components/PortalHeader";
import { RequestDetailDialog } from "@/components/RequestDetailDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STATUSES,
  STATUS_LABEL,
  formatDate,
  listRequests,
  type ProductRequest,
} from "@/lib/product-requests";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portal Linha Amarela | Cadastro de Produtos" },
      {
        name: "description",
        content:
          "Centralize as solicitações de cadastro de peças e produtos de linha amarela antes do registro no SAP.",
      },
      { property: "og:title", content: "Portal Linha Amarela | Cadastro de Produtos" },
      {
        property: "og:description",
        content:
          "Centralize as solicitações de cadastro de peças e produtos de linha amarela antes do registro no SAP.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [selected, setSelected] = useState<ProductRequest | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["product-requests"],
    queryFn: listRequests,
  });

  const requests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((r) => {
      const matchesStatus = statusFilter === "todos" || r.status === statusFilter;
      const matchesTerm =
        !term ||
        [r.product_name, r.manufacturer, r.part_number, r.sap_code, r.requester_name]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(term));
      return matchesStatus && matchesTerm;
    });
  }, [data, search, statusFilter]);

  const counts = useMemo(() => {
    const base = { pendente: 0, em_analise: 0, cadastrado: 0, recusado: 0 };
    for (const r of data ?? []) base[r.status] += 1;
    return base;
  }, [data]);

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Solicitações de cadastro
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tudo em um só lugar, pronto para registrar no SAP.
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/nova">
              <Plus className="size-4" aria-hidden="true" />
              Nova solicitação
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STATUSES.map((s) => (
            <div key={s} className="rounded-md border border-border bg-card p-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {STATUS_LABEL[s]}
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">{counts[s]}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por peça, fabricante, part number ou código SAP"
              aria-label="Buscar solicitações"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-56" aria-label="Filtrar por status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 space-y-3">
          {isLoading &&
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-md" />)}

          {!isLoading && requests.length === 0 && (
            <div className="rounded-md border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma solicitação encontrada. Cadastre a primeira peça.
              </p>
            </div>
          )}

          {requests.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r)}
              className="w-full rounded-md border border-border bg-card p-4 text-left transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{r.product_name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {r.manufacturer}
                    {r.part_number ? ` · PN ${r.part_number}` : ""}
                    {r.dimensions ? ` · ${r.dimensions}` : ""} · {r.unit_of_measure}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.requester_name} · {formatDate(r.created_at)}
                    {r.sap_code ? ` · SAP ${r.sap_code}` : ""}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            </button>
          ))}
        </div>
      </main>

      <RequestDetailDialog
        request={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onSaved={() => void refetch()}
      />
    </div>
  );
}
