CREATE TABLE public.generated_diets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.calculator_leads(id) ON DELETE CASCADE NOT NULL,
  diet_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_diets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated reads" ON public.generated_diets
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated inserts" ON public.generated_diets
  FOR INSERT TO authenticated WITH CHECK (true);