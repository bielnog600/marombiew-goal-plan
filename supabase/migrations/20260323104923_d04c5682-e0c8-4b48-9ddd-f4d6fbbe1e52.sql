
ALTER TABLE public.calculator_leads
  ADD COLUMN custom_calorias numeric DEFAULT NULL,
  ADD COLUMN custom_proteina_g numeric DEFAULT NULL,
  ADD COLUMN custom_carboidrato_g numeric DEFAULT NULL,
  ADD COLUMN custom_gordura_g numeric DEFAULT NULL;

CREATE POLICY "Allow authenticated updates" ON public.calculator_leads
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
