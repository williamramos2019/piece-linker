import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  STATUSES,
  STATUS_LABEL,
  formatDate,
  getImageUrl,
  type ProductRequest,
  type RequestStatus,
} from "@/lib/product-requests";
import { StatusBadge } from "./StatusBadge";

export interface RequestDetailDialogProps {
  request: ProductRequest | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="text-sm break-words text-foreground">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

export function RequestDetailDialog({ request, onOpenChange, onSaved }: RequestDetailDialogProps) {
  const [status, setStatus] = useState<RequestStatus>("pendente");
  const [sapCode, setSapCode] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!request) return;
    setStatus(request.status);
    setSapCode(request.sap_code ?? "");
    setImageUrl(null);
    if (request.image_url) {
      void getImageUrl(request.image_url).then(setImageUrl);
    }
  }, [request]);

  async function handleSave() {
    if (!request) return;
    setSaving(true);
    const { error } = await supabase
      .from("product_requests")
      .update({ status, sap_code: sapCode.trim() || null })
      .eq("id", request.id);
    setSaving(false);

    if (error) {
      toast.error("Não foi possível salvar as alterações.");
      return;
    }
    toast.success("Solicitação atualizada.");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={request !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {request && (
          <>
            <DialogHeader>
              <DialogTitle className="pr-8">{request.product_name}</DialogTitle>
              <DialogDescription>
                Solicitado por {request.requester_name} em {formatDate(request.created_at)}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={request.status} />
              {request.sap_code && (
                <span className="text-xs text-muted-foreground">SAP: {request.sap_code}</span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Fabricante" value={request.manufacturer} />
              <Field label="Part number" value={request.part_number} />
              <Field label="Dimensões" value={request.dimensions} />
              <Field label="Unidade de medida" value={request.unit_of_measure} />
              <Field label="Setor" value={request.department} />
              <Field label="Observações" value={request.notes} />
            </div>

            {request.reference_link && (
              <a
                href={request.reference_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline underline-offset-4"
              >
                Abrir catálogo / foto de referência
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            )}

            {imageUrl && (
              <img
                src={imageUrl}
                alt={`Imagem de referência de ${request.product_name}`}
                loading="lazy"
                className="max-h-72 w-full rounded-md border border-border object-contain"
              />
            )}

            <div className="grid gap-4 rounded-md border border-border bg-muted/40 p-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as RequestStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sap">Código SAP</Label>
                <Input
                  id="sap"
                  value={sapCode}
                  maxLength={40}
                  placeholder="Ex.: 100023456"
                  onChange={(e) => setSapCode(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                  {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  Salvar alterações
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
