import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DietPlan, DietFood, DietMeal } from "./dietTypes";

type Density = { kcalPerG: number; pPerG: number; cPerG: number; fPerG: number };

const densityOf = (f: DietFood): Density => {
  const g = f.grams > 0 ? f.grams : 1;
  return {
    kcalPerG: f.kcal / g,
    pPerG: f.protein / g,
    cPerG: f.carbs / g,
    fPerG: f.fat / g,
  };
};

const applyGrams = (f: DietFood, grams: number, d: Density): DietFood => ({
  ...f,
  grams: Math.max(0, Math.round(grams)),
  kcal: Math.round(d.kcalPerG * grams),
  protein: Math.round(d.pPerG * grams * 10) / 10,
  carbs: Math.round(d.cPerG * grams * 10) / 10,
  fat: Math.round(d.fPerG * grams * 10) / 10,
});

const recomputeSubtotal = (foods: DietFood[]) => ({
  kcal: Math.round(foods.reduce((s, f) => s + f.kcal, 0)),
  protein: Math.round(foods.reduce((s, f) => s + f.protein, 0) * 10) / 10,
  carbs: Math.round(foods.reduce((s, f) => s + f.carbs, 0) * 10) / 10,
  fat: Math.round(foods.reduce((s, f) => s + f.fat, 0) * 10) / 10,
});

const recomputeTotals = (meals: DietMeal[]) => ({
  kcal: Math.round(meals.reduce((s, m) => s + m.subtotal.kcal, 0)),
  protein: Math.round(meals.reduce((s, m) => s + m.subtotal.protein, 0) * 10) / 10,
  carbs: Math.round(meals.reduce((s, m) => s + m.subtotal.carbs, 0) * 10) / 10,
  fat: Math.round(meals.reduce((s, m) => s + m.subtotal.fat, 0) * 10) / 10,
});

interface Props {
  initial: DietPlan;
  onSave: (updated: DietPlan) => Promise<void> | void;
  onCancel: () => void;
  saving?: boolean;
}

const DietEditor = ({ initial, onSave, onCancel, saving }: Props) => {
  // Snapshot per-food density and per-meal kcal target (from initial plan)
  const [densities] = useState<Record<string, Density>>(() => {
    const map: Record<string, Density> = {};
    initial.meals.forEach((m, mi) =>
      m.foods.forEach((f, fi) => {
        map[`${mi}:${fi}`] = densityOf(f);
      })
    );
    return map;
  });
  const [mealTargets] = useState<number[]>(() =>
    initial.meals.map((m) => m.subtotal.kcal)
  );

  // Working copy — we keep an internal id key per food for density lookup
  type EditFood = DietFood & { _key: string };
  type EditMeal = Omit<DietMeal, "foods"> & { foods: EditFood[] };

  const [meals, setMeals] = useState<EditMeal[]>(() =>
    initial.meals.map((m, mi) => ({
      ...m,
      foods: m.foods.map((f, fi) => ({ ...f, _key: `${mi}:${fi}` })),
    }))
  );
  const [nextKey, setNextKey] = useState(1000);
  const [tips, setTips] = useState<string[]>(initial.tips || []);

  const [addingMeal, setAddingMeal] = useState<number | null>(null);
  const [newFood, setNewFood] = useState({
    name: "",
    grams: "100",
    kcal100: "",
    p100: "",
    c100: "",
    f100: "",
  });

  const totals = useMemo(() => recomputeTotals(meals as DietMeal[]), [meals]);

  const getDensity = (key: string, food: EditFood): Density =>
    densities[key] || densityOf(food);

  const rebalanceMeal = (mealIdx: number, lockedFoodKey: string | null): EditMeal => {
    const meal = meals[mealIdx];
    const target = mealTargets[mealIdx];
    const locked = lockedFoodKey ? meal.foods.find((f) => f._key === lockedFoodKey) : null;
    const lockedKcal = locked ? locked.kcal : 0;
    const others = meal.foods.filter((f) => f._key !== lockedFoodKey);
    const currentOther = others.reduce((s, f) => s + f.kcal, 0);
    const remaining = target - lockedKcal;

    let newFoods = meal.foods;
    if (others.length > 0 && currentOther > 0 && remaining > 0) {
      const factor = remaining / currentOther;
      newFoods = meal.foods.map((f) => {
        if (f._key === lockedFoodKey) return f;
        const d = getDensity(f._key, f);
        const newGrams = Math.max(1, f.grams * factor);
        return { ...applyGrams(f, newGrams, d), _key: f._key };
      });
    }
    return { ...meal, foods: newFoods, subtotal: recomputeSubtotal(newFoods) };
  };

  const updateGrams = (mealIdx: number, foodKey: string, gramsStr: string) => {
    const grams = parseFloat(gramsStr);
    if (isNaN(grams) || grams < 0) return;
    setMeals((prev) => {
      const next = [...prev];
      const meal = { ...next[mealIdx] };
      meal.foods = meal.foods.map((f) => {
        if (f._key !== foodKey) return f;
        const d = getDensity(f._key, f);
        return { ...applyGrams(f, grams, d), _key: f._key };
      });
      next[mealIdx] = { ...meal, subtotal: recomputeSubtotal(meal.foods) };
      // auto-rebalance others in meal
      next[mealIdx] = rebalanceMealFromState(next, mealIdx, foodKey);
      return next;
    });
  };

  // Helper that rebalances using a specific meals array (post-edit)
  const rebalanceMealFromState = (
    arr: EditMeal[],
    mealIdx: number,
    lockedFoodKey: string | null
  ): EditMeal => {
    const meal = arr[mealIdx];
    const target = mealTargets[mealIdx];
    const locked = lockedFoodKey ? meal.foods.find((f) => f._key === lockedFoodKey) : null;
    const lockedKcal = locked ? locked.kcal : 0;
    const currentOther = meal.foods
      .filter((f) => f._key !== lockedFoodKey)
      .reduce((s, f) => s + f.kcal, 0);
    const remaining = target - lockedKcal;
    if (currentOther <= 0 || remaining <= 0) return { ...meal, subtotal: recomputeSubtotal(meal.foods) };
    const factor = remaining / currentOther;
    const newFoods = meal.foods.map((f) => {
      if (f._key === lockedFoodKey) return f;
      const d = getDensity(f._key, f);
      const newGrams = Math.max(1, f.grams * factor);
      return { ...applyGrams(f, newGrams, d), _key: f._key };
    });
    return { ...meal, foods: newFoods, subtotal: recomputeSubtotal(newFoods) };
  };

  const removeFood = (mealIdx: number, foodKey: string) => {
    setMeals((prev) => {
      const next = [...prev];
      const meal = { ...next[mealIdx] };
      meal.foods = meal.foods.filter((f) => f._key !== foodKey);
      next[mealIdx] = { ...meal, subtotal: recomputeSubtotal(meal.foods) };
      // rebalance others to hit target
      next[mealIdx] = rebalanceMealFromState(next, mealIdx, null);
      return next;
    });
  };

  const addFoodToMeal = (mealIdx: number) => {
    const grams = parseFloat(newFood.grams);
    const k100 = parseFloat(newFood.kcal100);
    const p100 = parseFloat(newFood.p100);
    const c100 = parseFloat(newFood.c100);
    const f100 = parseFloat(newFood.f100);
    if (!newFood.name.trim() || isNaN(grams) || grams <= 0 || isNaN(k100)) return;
    const density: Density = {
      kcalPerG: k100 / 100,
      pPerG: (isNaN(p100) ? 0 : p100) / 100,
      cPerG: (isNaN(c100) ? 0 : c100) / 100,
      fPerG: (isNaN(f100) ? 0 : f100) / 100,
    };
    const key = `new:${nextKey}`;
    setNextKey((n) => n + 1);
    densities[key] = density;
    const food: EditFood = {
      _key: key,
      name: newFood.name.trim(),
      grams: Math.round(grams),
      kcal: Math.round(density.kcalPerG * grams),
      protein: Math.round(density.pPerG * grams * 10) / 10,
      carbs: Math.round(density.cPerG * grams * 10) / 10,
      fat: Math.round(density.fPerG * grams * 10) / 10,
      variations: [],
    };
    setMeals((prev) => {
      const next = [...prev];
      const meal = { ...next[mealIdx] };
      meal.foods = [...meal.foods, food];
      next[mealIdx] = { ...meal, subtotal: recomputeSubtotal(meal.foods) };
      // rebalance others to keep target (lock the newly added one)
      next[mealIdx] = rebalanceMealFromState(next, mealIdx, key);
      return next;
    });
    setNewFood({ name: "", grams: "100", kcal100: "", p100: "", c100: "", f100: "" });
    setAddingMeal(null);
  };

  const rebalanceButton = (mealIdx: number) => {
    setMeals((prev) => {
      const next = [...prev];
      next[mealIdx] = rebalanceMealFromState(next, mealIdx, null);
      return next;
    });
  };

  const handleSave = () => {
    const clean: DietPlan = {
      meals: meals.map((m) => ({
        name: m.name,
        time: m.time,
        emoji: m.emoji,
        subtotal: m.subtotal,
        foods: m.foods.map(({ _key, ...rest }) => rest),
      })),
      totals,
      tips,
    };
    onSave(clean);
  };

  return (
    <div className="space-y-4">
      {/* Totals bar */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-primary/20 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-primary">{totals.kcal}</p>
          <p className="text-[10px] text-muted-foreground uppercase">kcal</p>
        </div>
        <div className="bg-destructive/15 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-destructive">{totals.protein}g</p>
          <p className="text-[10px] text-muted-foreground uppercase">Proteína</p>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background: "rgba(52,152,219,0.15)" }}>
          <p className="text-lg font-bold" style={{ color: "#3498db" }}>{totals.carbs}g</p>
          <p className="text-[10px] text-muted-foreground uppercase">Carboidrato</p>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background: "rgba(46,204,113,0.15)" }}>
          <p className="text-lg font-bold" style={{ color: "#2ecc71" }}>{totals.fat}g</p>
          <p className="text-[10px] text-muted-foreground uppercase">Gordura</p>
        </div>
      </div>

      <div className="max-h-[45vh] overflow-y-auto space-y-3 pr-1">
        {meals.map((meal, mi) => (
          <div key={mi} className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{meal.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{meal.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    ⏰ {meal.time} · alvo {mealTargets[mi]} kcal
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-1 rounded-full">
                  {meal.subtotal.kcal} kcal
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => rebalanceButton(mi)}
                  className="h-7 px-2 text-[10px]"
                  title="Ajustar porções para bater a meta da refeição"
                >
                  ⚖️
                </Button>
              </div>
            </div>
            <div className="px-3 py-2 space-y-2">
              {meal.foods.map((food) => (
                <div key={food._key} className="flex items-center gap-2 text-xs">
                  <span className="flex-1 font-medium text-foreground truncate">{food.name}</span>
                  <Input
                    type="number"
                    value={food.grams}
                    onChange={(e) => updateGrams(mi, food._key, e.target.value)}
                    className="h-7 w-16 text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground w-8">g</span>
                  <span className="text-[10px] text-muted-foreground w-32 text-right">
                    {food.kcal}cal · P{food.protein} C{food.carbs} G{food.fat}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFood(mi, food._key)}
                    className="h-7 w-7 p-0 text-destructive"
                  >
                    ✕
                  </Button>
                </div>
              ))}

              {addingMeal === mi ? (
                <div className="border border-dashed border-primary/40 rounded p-2 space-y-1">
                  <Input
                    placeholder="Nome do alimento"
                    value={newFood.name}
                    onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                    className="h-7 text-xs"
                  />
                  <div className="grid grid-cols-5 gap-1">
                    <Input
                      placeholder="g"
                      value={newFood.grams}
                      onChange={(e) => setNewFood({ ...newFood, grams: e.target.value })}
                      className="h-7 text-xs"
                    />
                    <Input
                      placeholder="kcal/100g"
                      value={newFood.kcal100}
                      onChange={(e) => setNewFood({ ...newFood, kcal100: e.target.value })}
                      className="h-7 text-xs"
                    />
                    <Input
                      placeholder="P/100g"
                      value={newFood.p100}
                      onChange={(e) => setNewFood({ ...newFood, p100: e.target.value })}
                      className="h-7 text-xs"
                    />
                    <Input
                      placeholder="C/100g"
                      value={newFood.c100}
                      onChange={(e) => setNewFood({ ...newFood, c100: e.target.value })}
                      className="h-7 text-xs"
                    />
                    <Input
                      placeholder="G/100g"
                      value={newFood.f100}
                      onChange={(e) => setNewFood({ ...newFood, f100: e.target.value })}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="flex gap-1 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAddingMeal(null)}
                      className="h-6 text-[10px]"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => addFoodToMeal(mi)}
                      className="h-6 text-[10px]"
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddingMeal(mi)}
                  className="h-6 text-[10px] w-full"
                >
                  ➕ Adicionar alimento
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="font-bold">
          {saving ? "Salvando..." : "💾 Salvar alterações"}
        </Button>
      </div>
    </div>
  );
};

export default DietEditor;
