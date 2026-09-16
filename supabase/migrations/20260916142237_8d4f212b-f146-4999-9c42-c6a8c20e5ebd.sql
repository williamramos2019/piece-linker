CREATE TABLE public.product_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  manufacturer text NOT NULL,
  part_number text,
  dimensions text,
  unit_of_measure text NOT NULL DEFAULT 'UN',
  reference_link text,
  image_url text,
  requester_name text NOT NULL,
  department text,
  notes text,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_analise','cadastrado','recusado')),
  sap_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.product_requests TO anon, authenticated;
GRANT ALL ON public.product_requests TO service_role;

ALTER TABLE public.product_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view requests" ON public.product_requests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create requests" ON public.product_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update requests" ON public.product_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_product_requests_status ON public.product_requests(status);
CREATE INDEX idx_product_requests_created_at ON public.product_requests(created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_product_requests_updated_at
BEFORE UPDATE ON public.product_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();