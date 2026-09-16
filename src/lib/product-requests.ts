import { supabase } from "@/integrations/supabase/client";

export const STATUSES = ["pendente", "em_analise", "cadastrado", "recusado"] as const;
export type RequestStatus = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pendente: "Pendente",
  em_analise: "Em análise",
  cadastrado: "Cadastrado no SAP",
  recusado: "Recusado",
};

export const UNITS = [
  "UN",
  "PC",
  "CJ",
  "KG",
  "G",
  "M",
  "CM",
  "MM",
  "M2",
  "M3",
  "L",
  "ML",
  "PAR",
  "CX",
  "RL",
] as const;

export interface ProductRequest {
  id: string;
  product_name: string;
  manufacturer: string;
  part_number: string | null;
  dimensions: string | null;
  unit_of_measure: string;
  reference_link: string | null;
  image_url: string | null;
  requester_name: string;
  department: string | null;
  notes: string | null;
  status: RequestStatus;
  sap_code: string | null;
  created_at: string;
  updated_at: string;
}

export async function listRequests(): Promise<ProductRequest[]> {
  const { data, error } = await supabase
    .from("product_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ProductRequest[];
}

/** Uploads the reference image and returns the stored object path. */
export async function uploadReferenceImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw new Error(error.message);
  return path;
}

/** Private bucket: build a temporary readable URL for an uploaded image. */
export async function getImageUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("product-images")
    .createSignedUrl(path, 60 * 60);

  if (error) return null;
  return data.signedUrl;
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
