import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { DietLead } from "./dietTypes";

interface MacroEditDialogProps {
  lead: DietLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const MacroEditDialog = ({ lead, open, onOpenChange, onSaved }: MacroEditDialogProps) => {
  const [calorias, setCalorias] = useState("");
  const [proteina, setProteina] = useState("");
  const [carbs, setCarbs] = useState("");
  const [gordura, setGordura] = useState("");
  const [saving, setSaving] = useState(false);

  const resetToLead = () => {
    if (!lead) return;
    setCalorias(String(lead.custom_calorias ?? lead.calorias_ajustadas ?? ""));
    setProteina(String(lead.custom_proteina_g ?? lead.proteina_g ?? ""));
    setCarbs(String(lead.custom_carboidrato_g ?? lead.carboidrato_g ?? ""));
    setGordura(String(lead.custom_gordura_g ?? lead.gordura_g ?? ""));
  };

  const handleOpenChange = (val: boolean) => {
    if (val && lead) resetToLead();
    onOpenChange(val);
  };

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    const { error } = await supabase
      .from("calculator_leads")
      .update({
        custom_calorias: calorias ? Number(calorias) : null,
        custom_proteina_g: proteina ? Number(proteina) : null,
        custom_carboidrato_g: carbs ? Number(carbs) : null,
        custom_gordura_g: gordura ? Number(gordura) : null,
      })
      .eq("id", lead.id);

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Macros personalizados salvos!");
      onSaved();
      onOpenChange(false);
    }
  };

  const handleReset = async () => {
    if (!lead) return;
    setSaving(true);
    const { error } = await supabase
      .from("calculator_leads")
      .update({
        custom_calorias: null,
        custom_proteina_g: null,
        custom_carboidrato_g: null,
        custom_gordura_g: null,
      })
      .eq("id", lead.id);

    setSaving(false);
    if (error) {
      toast.error("Erro ao resetar");
    } else {
      toast.success("Macros restaurados para os originais");
      onSaved();
      onOpenChange(false);
    }
  };

  if (!lead) return null;

  const hasCustom = lead.custom_calorias != null || lead.custom_proteina_g != null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-primary">✏️ Editar Macros - {lead.nome.split(" ")[0]}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Originais: {lead.calorias_ajustadas} kcal · P:{lead.proteina_g}g · C:{lead.carboidrato_g}g · G:{lead.gordura_g}g
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Calorias (kcal)</Label>
            <Input type="number" value={calorias} onChange={(e) => setCalorias(e.target.value)} className="bg-input border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Proteína (g)</Label>
            <Input type="number" value={proteina} onChange={(e) => setProteina(e.target.value)} className="bg-input border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Carboidrato (g)</Label>
            <Input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} className="bg-input border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Gordura (g)</Label>
            <Input type="number" value={gordura} onChange={(e) => setGordura(e.target.value)} className="bg-input border-border" />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          {hasCustom && (
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={saving} className="text-xs text-muted-foreground">
              🔄 Restaurar originais
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving} className="font-bold text-xs">
            {saving ? "Salvando..." : "💾 Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MacroEditDialog;
