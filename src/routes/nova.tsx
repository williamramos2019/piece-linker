import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PortalHeader } from "@/components/PortalHeader";
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
import { UNITS, uploadReferenceImage } from "@/lib/product-requests";

const schema = z.object({
  product_name: z.string().trim().min(2, "Informe o nome da peça").max(120),
  manufacturer: z.string().trim().min(2, "Informe o fabricante").max(120),
  part_number: z.string().trim().max(80).optional(),
  dimensions: z.string().trim().max(120).optional(),
  unit_of_measure: z.string().min(1),
  reference_link: z.string().trim().url("Informe um link válido").max(500).or(z.literal("")),
  requester_name: z.string().trim().min(2, "Informe seu nome").max(120),
  department: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/nova")({
  head: () => ({
    meta: [
      { title: "Nova solicitação de cadastro | Portal Linha Amarela" },
      {
        name: "description",
        content:
          "Envie os dados da peça — dimensões, part number, fabricante e imagem de referência — para cadastro no SAP.",
      },
      { property: "og:title", content: "Nova solicitação de cadastro | Portal Linha Amarela" },
      {
        property: "og:description",
        content: "Envie os dados da peça de linha amarela para cadastro no SAP.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewRequest;
});

function NewRequest() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { unit_of_measure: "UN", reference_link: "" },
  });

  async function onSubmit(values: FormValues) {
    try {
      let imagePath: string | null = null;
      if (file) imagePath = await uploadReferenceImage(file);

      const { error } = await supabase.from("product_requests").insert({
        product_name: values.product_name,
        manufacturer: values.manufacturer,
        part_number: values.part_number || null,
        dimensions: values.dimensions || null,
        unit_of_measure: values.unit_of_measure,
        reference_link: values.reference_link || null,
        image_url: imagePath,
        requester_name: values.requester_name,
        department: values.department || null,
        notes: values.notes || null,
      });
      if (error) throw new Error(error.message);

      toast.success("Solicitação enviada!");
      void navigate({ to: "/" });
    } catch {
      toast.error("Não foi possível enviar a solicitação. Tente novamente.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar
        </Link>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          Nova solicitação de cadastro
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha os dados da peça. Campos com * são obrigatórios.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-5 rounded-md border border-border bg-card p-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="product_name">Nome da peça ou produto *</Label>
              <Input id="product_name" {...register("product_name")} />
              {errors.product_name && (
                <p className="text-xs text-destructive">{errors.product_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Fabricante *</Label>
              <Input id="manufacturer" placeholder="Ex.: Caterpillar" {...register("manufacturer")} />
              {errors.manufacturer && (
                <p className="text-xs text-destructive">{errors.manufacturer.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="part_number">Part number</Label>
              <Input id="part_number" {...register("part_number")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dimensions">Dimensões</Label>
              <Input id="dimensions" placeholder="Ex.: 120 x 60 x 25 mm" {...register("dimensions")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unidade de medida *</Label>
              <Select
                value={watch("unit_of_measure")}
                onValueChange={(v) => setValue("unit_of_measure", v)}
              >
                <SelectTrigger id="unit">
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
              <Label htmlFor="reference_link">Link da foto ou catálogo</Label>
              <Input id="reference_link" placeholder="https://..." {...register("reference_link")} />
              {errors.reference_link && (
                <p className="text-xs text-destructive">{errors.reference_link.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="image">Imagem de referência (arquivo)</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP de até 10 MB.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requester_name">Seu nome *</Label>
              <Input id="requester_name" {...register("requester_name")} />
              {errors.requester_name && (
                <p className="text-xs text-destructive">{errors.requester_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Setor</Label>
              <Input id="department" placeholder="Ex.: Manutenção" {...register("department")} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" rows={4} {...register("notes")} />
            </div>
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Enviar solicitação
          </Button>
        </form>
      </main>
    </div>
  );
}
