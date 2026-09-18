import { STATUS_LABEL, formatDate, type ProductRequest } from "./product-requests";

const HEADERS = [
  "Peça/Produto",
  "Fabricante",
  "Part number",
  "Dimensões",
  "Unidade",
  "Link de referência",
  "Solicitante",
  "Setor",
  "Observações",
  "Status",
  "Código SAP",
  "Data da solicitação",
] as const;

function cell(value: string | null | undefined): string {
  const text = (value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function toRow(r: ProductRequest): string {
  return [
    r.product_name,
    r.manufacturer,
    r.part_number,
    r.dimensions,
    r.unit_of_measure,
    r.reference_link,
    r.requester_name,
    r.department,
    r.notes,
    STATUS_LABEL[r.status],
    r.sap_code,
    formatDate(r.created_at),
  ]
    .map(cell)
    .join(";");
}

/** Downloads the given requests as a spreadsheet-friendly CSV (Excel pt-BR). */
export function exportRequestsToCsv(requests: ProductRequest[]): void {
  const csv = [HEADERS.map(cell).join(";"), ...requests.map(toRow)].join("\r\n");
  // BOM keeps accented characters readable when Excel opens the file.
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `solicitacoes-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
