import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { UNITS, type ProductRequest } from "@/lib/product-requests";

export interface RequestEditFormProps {
  request: ProductRequest;
  onCancel: () => void;
  onSaved: () => void;
}

type EditableFields = Pick<
  ProductRequest,
  | "product_name"
  | "manufacturer"
  | "part_number"
  | "dimensions"
  | "unit_of_measure"
  | "reference_link"
  | "requester_name"
  | "department"
  | "notes"
>;

function initialValues(r: ProductRequest): EditableFields {
  return {
    product_name: r.product_name,
    manufacturer: r.manufacturer,
    part_number: r.part_number ?? "",
    dimensions: r.dimensions ?? "",
    unit_of_measure: r.unit_of_measure,
    reference_link: r.reference_link ?? "",
    requester_name: r.requester_name,
    department: r.department ?? "",
    notes: r.notes ?? "",
  };
}

/** Lets the requester fix the information they sent. */
export function RequestEditForm({ request, onCancel, onSaved }: RequestEditFormProps) {
  const [values, setValues] = useState<EditableFields>(() => initialValues(request));
  const [saving, setSaving] = useState(false);

  function set<K extends keyof EditableFields>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (values.product_name.trim().length < 2 || values.manufacturer.trim().length < 2) {
      toast.error("Informe ao menos o nome da peça e o fabricante.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("product_requests")
      .update({
        product_name: values.product_name.trim(),
        manufacturer: values.manufacturer.trim(),
        part_number: values.part_number?.trim() || null,
        dimensions: values.dimensions?.trim() || null,
        unit_of_measure: values.unit_of_measure,
        reference_link: values.reference_link?.trim() || null,
        requester_name: values.requester_name.trim(),
        department: values.department?.trim() || null,
        notes: values.notes?.trim() || null,
      })
      .eq("id", request.id);
    setSaving(false);

    if (error) {
      toast.error("Não foi possível salvar a correção.");
      return;
    }
    toast.success("Solicitação corrigida.");
    onSaved();
  }

  return (
    <div className="grid gap-4 rounded-md border border-border bg-muted/40 p-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="edit-name">Nome da peça ou produto</Label>
        <Input
          id="edit-name"
          value={values.product_name}
          onChange={(e) => set("product_name", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-manufacturer">Fabricante</Label>
        <Input
          id="edit-manufacturer"
          value={values.manufacturer}
          onChange={(e) => set("manufacturer", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-pn">Part number</Label>
        <Input
          id="edit-pn"
          value={values.part_number ?? ""}
          onChange={(e) => set("part_number", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-dimensions">Dimensões</Label>
        <Input
          id="edit-dimensions"
          value={values.dimensions ?? ""}
          onChange={(e) => set("dimensions", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-unit">Unidade de medida</Label>
        <Select
          value={values.unit_of_measure}
          onValueChange={(v) => set("unit_of_measure", v)}
        >
          <SelectTrigger id="edit-unit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNITS.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="edit-link">Link da foto ou catálogo</Label>
        <Input
          id="edit-link"
          placeholder="https://..."
          value={values.reference_link ?? ""}
          onChange={(e) => set("reference_link", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-requester">Solicitante</Label>
        <Input
          id="edit-requester"
          value={values.requester_name}
          onChange={(e) => set("requester_name", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-department">Setor</Label>
        <Input
          id="edit-department"
          value={values.department ?? ""}
          onChange={(e) => set("department", e.target.value)}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="edit-notes">Observações</Label>
        <Textarea
          id="edit-notes"
          rows={3}
          value={values.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Salvar correção
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
