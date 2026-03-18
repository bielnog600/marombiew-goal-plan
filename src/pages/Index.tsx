import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo_marombiew.png";

type FormData = {
  nome: string;
  whatsapp: string;
  sexo: "masculino" | "feminino" | "";
  idade: string;
  peso: string;
  altura: string;
  nivelAtividade: string;
  objetivo: string;
};

type Resultado = {
  tmb: number;
  tdee: number;
  caloriasAjustadas: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
};

const ATIVIDADE_FATORES: Record<string, { label: string; fator: number }> = {
  sedentario: { label: "Sedentário (pouco ou nenhum exercício)", fator: 1.2 },
  leve: { label: "Levemente ativo (1-3x/semana)", fator: 1.375 },
  moderado: { label: "Moderadamente ativo (3-5x/semana)", fator: 1.55 },
  muito: { label: "Muito ativo (6-7x/semana)", fator: 1.725 },
  extremo: { label: "Extremamente ativo (2x/dia)", fator: 1.9 },
};

const OBJETIVOS: Record<string, { label: string; fator: number; descricao: string }> = {
  emagrecimento: { label: "🔥 Emagrecimento", fator: 0.8, descricao: "Déficit calórico de 20%" },
  hipertrofia: { label: "💪 Hipertrofia", fator: 1.15, descricao: "Superávit calórico de 15%" },
};

const TOTAL_STEPS = 5;

const Index = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    nome: "", whatsapp: "", sexo: "", idade: "", peso: "", altura: "", nivelAtividade: "", objetivo: "",
  });
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canNext = () => {
    switch (step) {
      case 1: return form.nome.trim().length >= 2 && form.whatsapp.trim().length >= 9;
      case 2: return form.sexo && Number(form.idade) > 0 && Number(form.peso) > 0 && Number(form.altura) > 0;
      case 3: return !!form.nivelAtividade;
      case 4: return !!form.objetivo;
      default: return false;
    }
  };

  const calcular = async () => {
    setLoading(true);
    const peso = Number(form.peso);
    const altura = Number(form.altura);
    const idade = Number(form.idade);

    // Mifflin-St Jeor
    const tmb = form.sexo === "masculino"
      ? 10 * peso + 6.25 * altura - 5 * idade + 5
      : 10 * peso + 6.25 * altura - 5 * idade - 161;

    const tdee = tmb * ATIVIDADE_FATORES[form.nivelAtividade].fator;
    const caloriasAjustadas = tdee * OBJETIVOS[form.objetivo].fator;

    // Macros
    let proteinaG: number, gorduraG: number, carboidratoG: number;
    if (form.objetivo === "hipertrofia") {
      proteinaG = peso * 2.2;
      gorduraG = peso * 1;
      carboidratoG = (caloriasAjustadas - proteinaG * 4 - gorduraG * 9) / 4;
    } else {
      proteinaG = peso * 2;
      gorduraG = peso * 0.8;
      carboidratoG = (caloriasAjustadas - proteinaG * 4 - gorduraG * 9) / 4;
    }

    const res: Resultado = {
      tmb: Math.round(tmb),
      tdee: Math.round(tdee),
      caloriasAjustadas: Math.round(caloriasAjustadas),
      proteina: Math.round(proteinaG),
      carboidrato: Math.round(Math.max(carboidratoG, 0)),
      gordura: Math.round(gorduraG),
    };

    setResultado(res);

    // Save to database
    try {
      await supabase.from("calculator_leads").insert({
        nome: form.nome.trim(),
        whatsapp: form.whatsapp.trim(),
        sexo: form.sexo,
        idade,
        peso,
        altura,
        nivel_atividade: form.nivelAtividade,
        objetivo: form.objetivo,
        tmb: res.tmb,
        tdee: res.tdee,
        calorias_ajustadas: res.caloriasAjustadas,
        proteina_g: res.proteina,
        carboidrato_g: res.carboidrato,
        gordura_g: res.gordura,
      });
    } catch (e) {
      console.error("Erro ao salvar lead:", e);
    }

    setLoading(false);
    setStep(5);
  };

  const handleNext = () => {
    if (step === 4) {
      calcular();
    } else {
      setStep((s) => s + 1);
    }
  };

  const whatsappLink = () => {
    const msg = encodeURIComponent(
      `Olá! Sou ${form.nome.trim()}, acabei de usar a Marombiew Calc.\n\nMeu objetivo: ${OBJETIVOS[form.objetivo]?.label || form.objetivo}\nCalorias diárias: ${resultado?.caloriasAjustadas} kcal\n\nQuero minha dieta personalizada! 💪`
    );
    return `https://wa.me/351939184666?text=${msg}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Marombiew" className="h-20 object-contain" />
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Etapa {step} de {TOTAL_STEPS}</span>
            <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
          </div>
          <Progress value={(step / TOTAL_STEPS) * 100} className="h-2 bg-secondary [&>div]:bg-primary" />
        </div>

        <Card className="border-primary/30 bg-card shadow-lg shadow-primary/5">
          {/* Step 1: Personal Data */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-primary text-xl text-center">📋 Seus Dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input placeholder="Seu nome" value={form.nome} onChange={(e) => updateField("nome", e.target.value)} className="bg-input border-border focus:border-primary" />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input placeholder="+351 / +55" value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} className="bg-input border-border focus:border-primary" />
                  <p className="text-xs text-muted-foreground">Portugal (+351) ou Brasil (+55)</p>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Physical Data */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="text-primary text-xl text-center">📏 Dados Físicos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Sexo</Label>
                  <RadioGroup value={form.sexo} onValueChange={(v) => updateField("sexo", v)} className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="masculino" id="m" />
                      <Label htmlFor="m" className="cursor-pointer">Masculino</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="feminino" id="f" />
                      <Label htmlFor="f" className="cursor-pointer">Feminino</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>Idade</Label>
                  <Input type="number" placeholder="25" value={form.idade} onChange={(e) => updateField("idade", e.target.value)} className="bg-input border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Peso (kg)</Label>
                  <Input type="number" placeholder="75" value={form.peso} onChange={(e) => updateField("peso", e.target.value)} className="bg-input border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Altura (cm)</Label>
                  <Input type="number" placeholder="175" value={form.altura} onChange={(e) => updateField("altura", e.target.value)} className="bg-input border-border" />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Activity Level */}
          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="text-primary text-xl text-center">🏃 Nível de Atividade</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={form.nivelAtividade} onValueChange={(v) => updateField("nivelAtividade", v)} className="space-y-3">
                  {Object.entries(ATIVIDADE_FATORES).map(([key, { label }]) => (
                    <div key={key} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value={key} id={key} />
                      <Label htmlFor={key} className="cursor-pointer flex-1 text-sm">{label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </>
          )}

          {/* Step 4: Goal */}
          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle className="text-primary text-xl text-center">🎯 Seu Objetivo</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={form.objetivo} onValueChange={(v) => updateField("objetivo", v)} className="space-y-3">
                  {Object.entries(OBJETIVOS).map(([key, { label, descricao }]) => (
                    <div key={key} className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value={key} id={key} />
                      <Label htmlFor={key} className="cursor-pointer flex-1">
                        <span className="text-base font-semibold block">{label}</span>
                        <span className="text-xs text-muted-foreground">{descricao}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </>
          )}

          {/* Step 5: Results */}
          {step === 5 && resultado && (
            <>
              <CardHeader>
                <CardTitle className="text-primary text-xl text-center">🏆 Seu Resultado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-sm text-muted-foreground">
                  {form.nome.split(" ")[0]}, aqui está o seu plano para <strong className="text-primary">{OBJETIVOS[form.objetivo]?.label}</strong>:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">TMB</p>
                    <p className="text-lg font-bold text-foreground">{resultado.tmb}</p>
                    <p className="text-xs text-muted-foreground">kcal</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">TDEE</p>
                    <p className="text-lg font-bold text-foreground">{resultado.tdee}</p>
                    <p className="text-xs text-muted-foreground">kcal</p>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">CALORIAS DIÁRIAS</p>
                  <p className="text-3xl font-bold text-primary">{resultado.caloriasAjustadas}</p>
                  <p className="text-xs text-muted-foreground">kcal/dia</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-center text-foreground">Macronutrientes</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-secondary rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Proteína</p>
                      <p className="text-lg font-bold text-primary">{resultado.proteina}g</p>
                      <p className="text-xs text-muted-foreground">{Math.round((resultado.proteina * 4 / resultado.caloriasAjustadas) * 100)}%</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Carbs</p>
                      <p className="text-lg font-bold text-primary">{resultado.carboidrato}g</p>
                      <p className="text-xs text-muted-foreground">{Math.round((resultado.carboidrato * 4 / resultado.caloriasAjustadas) * 100)}%</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Gordura</p>
                      <p className="text-lg font-bold text-primary">{resultado.gordura}g</p>
                      <p className="text-xs text-muted-foreground">{Math.round((resultado.gordura * 9 / resultado.caloriasAjustadas) * 100)}%</p>
                    </div>
                  </div>
                </div>

                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full text-base font-bold py-6 bg-green-600 hover:bg-green-700 text-white">
                    📲 Quero a minha dieta!
                  </Button>
                </a>

                <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => { setStep(1); setResultado(null); setForm({ nome: "", whatsapp: "", sexo: "", idade: "", peso: "", altura: "", nivelAtividade: "", objetivo: "" }); }}>
                  Recalcular
                </Button>
              </CardContent>
            </>
          )}

          {/* Navigation */}
          {step < 5 && (
            <div className="flex gap-3 p-6 pt-0">
              {step > 1 && (
                <Button variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>
                  Voltar
                </Button>
              )}
              <Button className="flex-1 font-bold" disabled={!canNext() || loading} onClick={handleNext}>
                {loading ? "Calculando..." : step === 4 ? "Calcular! 🚀" : "Próximo →"}
              </Button>
            </div>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Marombiew Calc © {new Date().getFullYear()} — Fórmula Mifflin-St Jeor
        </p>
      </div>
    </div>
  );
};

export default Index;
