import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { openDietPDF } from "./dietPdfTemplate";
import { formatWhatsAppNumber } from "@/lib/formatPhone";
import type { DietPlan, DietLead } from "./dietTypes";
import logo from "@/assets/logo_marombiew.png";

interface DietDialogProps {
  lead: DietLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DietDialog = ({ lead, open, onOpenChange }: DietDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [diet, setDiet] = useState<DietPlan | null>(null);
  const [error, setError] = useState("");
  const [savedDiets, setSavedDiets] = useState<{ id: string; diet_data: DietPlan; created_at: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [useCustom, setUseCustom] = useState(true);

  // Load saved diets when dialog opens
  useEffect(() => {
    if (open && lead) {
      loadSavedDiets();
      setDiet(null);
      setError("");
      setShowHistory(false);
    }
  }, [open, lead]);

  const loadSavedDiets = async () => {
    if (!lead) return;
    const { data } = await supabase
      .from("generated_diets")
      .select("id, diet_data, created_at")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false });
    if (data) {
      setSavedDiets(data.map(d => ({
        ...d,
        diet_data: d.diet_data as unknown as DietPlan
      })));
    }
  };

  const generateDiet = async () => {
    if (!lead) return;
    setLoading(true);
    setError("");
    setDiet(null);

    // Build lead data with chosen macros
    const hasCustom = lead.custom_calorias != null;
    const leadData = useCustom && hasCustom
      ? {
          ...lead,
          calorias_ajustadas: lead.custom_calorias ?? lead.calorias_ajustadas,
          proteina_g: lead.custom_proteina_g ?? lead.proteina_g,
          carboidrato_g: lead.custom_carboidrato_g ?? lead.carboidrato_g,
          gordura_g: lead.custom_gordura_g ?? lead.gordura_g,
        }
      : lead;

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-diet", {
        body: { lead: leadData },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      
      const dietData = data.diet as DietPlan;
      setDiet(dietData);

      // Auto-save to database
      const { error: saveError } = await supabase
        .from("generated_diets")
        .insert({ lead_id: lead.id, diet_data: dietData as any });
      
      if (!saveError) {
        loadSavedDiets();
      }
    } catch (e: any) {
      setError(e.message || "Erro ao gerar dieta");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = (dietData?: DietPlan) => {
    const d = dietData || diet;
    if (!d || !lead) return;
    openDietPDF(lead, d, logo);
  };

  const sendDietWhatsApp = (dietData?: DietPlan) => {
    const d = dietData || diet;
    if (!d || !lead) return;
    
    const phone = formatWhatsAppNumber(lead.whatsapp);
    const firstName = lead.nome.split(" ")[0];
    const objetivo = lead.objetivo === "hipertrofia" ? "💪 Hipertrofia" : "🔥 Emagrecimento";
    
    let mealsText = "";
    d.meals.forEach((meal) => {
      mealsText += `\n*${meal.emoji} ${meal.name}* (${meal.time})\n`;
      meal.foods.forEach((f) => {
        mealsText += `  • ${f.name} - ${f.grams}g\n`;
      });
      mealsText += `  _${meal.subtotal.kcal}kcal | P:${meal.subtotal.protein}g | C:${meal.subtotal.carbs}g | G:${meal.subtotal.fat}g_\n`;
    });

    const msg = `Olá ${firstName}! 👋\n\nSeu *Plano Alimentar Marombiew* está pronto! 🍽️\n\n*Objetivo:* ${objetivo}\n*Meta diária:* ${d.totals.kcal} kcal\n*Macros:* P:${d.totals.protein}g | C:${d.totals.carbs}g | G:${d.totals.fat}g\n${mealsText}\n*💡 Dicas:*\n${d.tips.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\n_Marombiew · Plano alimentar personalizado_`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const viewSavedDiet = (saved: { diet_data: DietPlan }) => {
    setDiet(saved.diet_data);
    setShowHistory(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-primary">
            🍽️ Dieta - {lead?.nome}
          </DialogTitle>
          <DialogDescription>
            {lead && (
              <span className="text-muted-foreground text-xs">
                {lead.objetivo === "hipertrofia" ? "💪 Hipertrofia" : "🔥 Emagrecimento"} · {lead.custom_calorias ?? lead.calorias_ajustadas} kcal · P:{lead.custom_proteina_g ?? lead.proteina_g}g C:{lead.custom_carboidrato_g ?? lead.carboidrato_g}g G:{lead.custom_gordura_g ?? lead.gordura_g}g
                {lead.custom_calorias != null && <span className="ml-1 text-primary">(personalizado)</span>}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* History toggle */}
        {savedDiets.length > 0 && !loading && (
          <div className="flex gap-2 mb-2">
            <Button
              variant={showHistory ? "outline" : "default"}
              size="sm"
              onClick={() => { setShowHistory(false); setDiet(null); }}
              className="text-xs"
            >
              ➕ Nova Dieta
            </Button>
            <Button
              variant={showHistory ? "default" : "outline"}
              size="sm"
              onClick={() => setShowHistory(true)}
              className="text-xs"
            >
              📋 Histórico ({savedDiets.length})
            </Button>
          </div>
        )}

        {/* History view */}
        {showHistory && (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {savedDiets.map((saved) => (
              <div key={saved.id} className="border border-border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {saved.diet_data.totals.kcal} kcal · P:{saved.diet_data.totals.protein}g · C:{saved.diet_data.totals.carbs}g · G:{saved.diet_data.totals.fat}g
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(saved.created_at).toLocaleString("pt-BR")} · {saved.diet_data.meals.length} refeições
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => viewSavedDiet(saved)} className="text-xs">
                    👁️
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDownloadPDF(saved.diet_data)} className="text-xs">
                    📄
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => sendDietWhatsApp(saved.diet_data)} className="text-xs">
                    📲
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Generate new */}
        {!diet && !loading && !error && !showHistory && (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4 text-sm">
              A IA vai gerar um plano alimentar personalizado com base nos dados do lead.
            </p>
            {lead && lead.custom_calorias != null && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <Button
                  size="sm"
                  variant={useCustom ? "default" : "outline"}
                  onClick={() => setUseCustom(true)}
                  className="text-xs"
                >
                  ✏️ Usar personalizados ({lead.custom_calorias} kcal)
                </Button>
                <Button
                  size="sm"
                  variant={!useCustom ? "default" : "outline"}
                  onClick={() => setUseCustom(false)}
                  className="text-xs"
                >
                  📊 Usar originais ({lead.calorias_ajustadas} kcal)
                </Button>
              </div>
            )}
            <Button onClick={generateDiet} className="font-bold">
              🤖 Gerar Dieta com IA
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Gerando plano alimentar...</p>
            <p className="text-muted-foreground text-xs mt-1">Isso pode levar alguns segundos</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-destructive mb-4 text-sm">{error}</p>
            <Button onClick={generateDiet} variant="outline" size="sm">
              Tentar novamente
            </Button>
          </div>
        )}

        {diet && !showHistory && (
          <div className="space-y-4">
            {/* Macro summary */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-primary/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-primary">{diet.totals.kcal}</p>
                <p className="text-[10px] text-muted-foreground uppercase">kcal</p>
              </div>
              <div className="bg-destructive/15 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-destructive">{diet.totals.protein}g</p>
                <p className="text-[10px] text-muted-foreground uppercase">Proteína</p>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ background: "rgba(52,152,219,0.15)" }}>
                <p className="text-lg font-bold" style={{ color: "#3498db" }}>{diet.totals.carbs}g</p>
                <p className="text-[10px] text-muted-foreground uppercase">Carboidrato</p>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ background: "rgba(46,204,113,0.15)" }}>
                <p className="text-lg font-bold" style={{ color: "#2ecc71" }}>{diet.totals.fat}g</p>
                <p className="text-[10px] text-muted-foreground uppercase">Gordura</p>
              </div>
            </div>

            {/* Meal cards */}
            <div className="max-h-[35vh] overflow-y-auto space-y-3 pr-1">
              {diet.meals.map((meal, i) => (
                <div key={i} className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{meal.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{meal.name}</p>
                        <p className="text-[10px] text-muted-foreground">⏰ {meal.time}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-1 rounded-full">
                      {meal.subtotal.kcal} kcal
                    </span>
                  </div>
                  <div className="px-4 py-2 space-y-1">
                    {meal.foods.map((food, j) => (
                      <div key={j} className="flex items-center justify-between text-xs text-foreground">
                        <span className="font-medium">{food.name} <span className="text-muted-foreground">({food.grams}g)</span></span>
                        <span className="text-muted-foreground text-[10px]">
                          {food.kcal}cal · P:{food.protein}g · C:{food.carbs}g · G:{food.fat}g
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Tips */}
            {diet.tips.length > 0 && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs font-semibold text-foreground mb-2">💡 Dicas</p>
                {diet.tips.map((tip, i) => (
                  <p key={i} className="text-xs text-muted-foreground mb-1">
                    <span className="text-primary font-bold">{i + 1}.</span> {tip}
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={generateDiet} className="text-xs">
                🔄 Gerar novamente
              </Button>
              <Button
                size="sm"
                onClick={() => sendDietWhatsApp()}
                className="text-xs bg-green-600 hover:bg-green-700 text-white"
              >
                📲 Enviar WhatsApp
              </Button>
              <Button size="sm" onClick={() => handleDownloadPDF()} className="bg-primary text-primary-foreground font-bold text-xs">
                📄 Salvar PDF
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DietDialog;
