CREATE TABLE public.calculator_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  sexo TEXT NOT NULL,
  idade INTEGER NOT NULL,
  peso NUMERIC NOT NULL,
  altura NUMERIC NOT NULL,
  nivel_atividade TEXT NOT NULL,
  objetivo TEXT NOT NULL,
  tmb NUMERIC,
  tdee NUMERIC,
  calorias_ajustadas NUMERIC,
  proteina_g NUMERIC,
  carboidrato_g NUMERIC,
  gordura_g NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.calculator_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON public.calculator_leads
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow authenticated reads" ON public.calculator_leads
  FOR SELECT TO authenticated USING (true);