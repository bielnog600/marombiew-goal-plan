import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo_marombiew.png";

type Lead = {
  id: string;
  nome: string;
  whatsapp: string;
  sexo: string;
  idade: number;
  peso: number;
  altura: number;
  nivel_atividade: string;
  objetivo: string;
  tmb: number | null;
  tdee: number | null;
  calorias_ajustadas: number | null;
  proteina_g: number | null;
  carboidrato_g: number | null;
  gordura_g: number | null;
  created_at: string;
};

interface DietDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DietDialog = ({ lead, open, onOpenChange }: DietDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [dietText, setDietText] = useState("");
  const [error, setError] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const generateDiet = async () => {
    if (!lead) return;
    setLoading(true);
    setError("");
    setDietText("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-diet", {
        body: { lead },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setDietText(data.diet);
    } catch (e: any) {
      setError(e.message || "Erro ao gerar dieta");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current || !lead) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dieta - ${lead.nome}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #F5C518; padding-bottom: 20px; }
          .header img { height: 60px; margin-bottom: 10px; }
          .header h1 { font-size: 22px; color: #1a1a1a; }
          .header p { font-size: 14px; color: #666; }
          .content { white-space: pre-wrap; font-size: 13px; line-height: 1.8; }
          .footer { margin-top: 40px; text-align: center; border-top: 2px solid #F5C518; padding-top: 15px; font-size: 11px; color: #999; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logo}" alt="Marombiew" />
          <h1>Plano Alimentar Personalizado</h1>
          <p>${lead.nome} · ${new Date().toLocaleDateString("pt-BR")}</p>
        </div>
        <div class="content">${dietText}</div>
        <div class="footer">
          Marombiew · Dieta gerada por IA · Consulte um nutricionista para ajustes
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
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

        {!dietText && !loading && (
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

        {dietText && (
          <div>
            <div ref={printRef} className="bg-background rounded-lg p-4 text-foreground text-sm whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto border border-border">
              {dietText}
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="outline" size="sm" onClick={generateDiet}>
                🔄 Gerar novamente
              </Button>
              <Button size="sm" onClick={handlePrint} className="bg-primary text-primary-foreground font-bold">
                📄 Imprimir / Salvar PDF
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DietDialog;
