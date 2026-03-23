import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { openDietPDF } from "./dietPdfTemplate";
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

  const generateDiet = async () => {
    if (!lead) return;
    setLoading(true);
    setError("");
    setDiet(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-diet", {
        body: { lead },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setDiet(data.diet as DietPlan);
    } catch (e: any) {
      setError(e.message || "Erro ao gerar dieta");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!diet || !lead) return;
    openDietPDF(lead, diet, logo);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-primary">
            🍽️ Gerar Dieta - {lead?.nome}
          </DialogTitle>
          <DialogDescription>
            {lead && (
              <span className="text-muted-foreground text-xs">
                {lead.objetivo === "hipertrofia" ? "💪 Hipertrofia" : "🔥 Emagrecimento"} · {lead.calorias_ajustadas} kcal · P:{lead.proteina_g}g C:{lead.carboidrato_g}g G:{lead.gordura_g}g
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {!diet && !loading && !error && (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4 text-sm">
              A IA vai gerar um plano alimentar personalizado com base nos dados do lead.
            </p>
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

        {diet && (
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

            {/* Meal cards preview */}
            <div className="max-h-[40vh] overflow-y-auto space-y-3 pr-1">
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

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={generateDiet}>
                🔄 Gerar novamente
              </Button>
              <Button size="sm" onClick={handleDownloadPDF} className="bg-primary text-primary-foreground font-bold">
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
