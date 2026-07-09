import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FOODS_DB = `Alimentos disponíveis (nome | kcal | prot | carb | gord por 100g):
Arroz integral|111|2.58|22.96|0.90
Arroz branco|129|2.50|28.18|0.23
Batata-doce|86|1.57|20.12|0.05
Batata inglesa cozida|77|1.90|17.13|0.12
Macarrão integral|124|5.33|26.54|0.54
Pão integral|260|9.10|47.20|4.10
Aveia em flocos|352|14.53|57.01|7.87
Tapioca|347|0.20|85.94|0.10
Mandioca cozida|173|1.34|37.46|2.04
Quinoa cozida|143|5.01|26.35|2.22
Feijão preto cozido|132|8.86|23.71|0.54
Feijão carioca cozido|76|4.80|13.60|0.50
Grão de bico|117|6.50|14.00|2.50
Lentilhas|165|8.39|18.73|6.76
Filé de frango grelhado|165|31.00|0.00|3.60
Peito de Frango|156|31.00|0.00|3.60
Carne bovina magra|269|25.54|0.00|17.67
Salmão grelhado|165|21.00|0.50|8.70
Atum em água|104|25.00|0.00|0.50
Filé de peixe grelhado|96|20.00|0.00|1.70
Camarão grelhado|154|24.47|1.17|5.03
Ovo cozido|154|12.53|1.12|10.57
Clara de ovo|52|10.90|0.73|0.17
Peito de peru assado|93|18.00|2.30|1.20
Brócolis cozido|22|2.31|4.40|0.12
Espinafre refogado|23|2.90|3.60|0.40
Couve refogada|48|1.77|4.00|0.70
Abobrinha refogada|17|1.20|3.10|0.30
Cenoura|41|0.93|9.58|0.24
Tomate|18|0.88|3.92|0.20
Pepino|15|0.65|3.63|0.11
Banana|89|1.10|23.00|0.30
Maçã|52|0.26|13.81|0.17
Morango|32|0.67|7.68|0.30
Abacaxi|48|0.54|12.63|0.12
Laranja|47|0.94|11.75|0.12
Mamão|46|0.44|11.58|0.14
Kiwi|61|1.10|15.00|0.50
Abacate|160|2.00|8.50|14.70
Iogurte natural desnatado|56|5.73|7.68|0.18
Iogurte grego natural|106|3.80|4.20|8.20
Leite integral|60|3.22|4.52|3.25
Queijo cottage|103|12.49|2.68|4.51
Queijo branco|230|14.58|4.25|17.27
Pasta de amendoim|588|24.47|19.97|49.84
Castanha de caju|574|15.31|32.69|46.35
Amêndoas|578|21.26|19.74|50.64
Azeite de oliva|884|0.00|0.00|100.00
Whey Protein Isolado|374|82.31|4.42|3.06
Granola sem açúcar|399|9.90|47.00|15.00
Mel|304|0.30|82.40|0.00
Torrada integral|350|13.67|56.67|8.00
Cuscuz|112|3.79|23.22|0.16`;

type FoodMacro = { kcal: number; protein: number; carbs: number; fat: number };
type DietVariation = { name: string; grams: number };
type DietFood = FoodMacro & { name: string; grams: number; variations?: DietVariation[] };
type DietMeal = {
  name: string;
  time: string;
  emoji: string;
  foods: DietFood[];
  subtotal: FoodMacro;
};
type DietPlan = {
  meals: DietMeal[];
  totals: FoodMacro;
  tips: string[];
};

const FOOD_MAP = new Map<string, FoodMacro>();
const FOOD_NAMES: string[] = [];

for (const line of FOODS_DB.split("\n").slice(1)) {
  const [name, kcal, protein, carbs, fat] = line.split("|");
  FOOD_NAMES.push(name);
  FOOD_MAP.set(name, {
    kcal: Number(kcal),
    protein: Number(protein),
    carbs: Number(carbs),
    fat: Number(fat),
  });
}

const normalizeName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const round1 = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 10) / 10;
const kcalFromMacros = (protein: number, carbs: number, fat: number) => round1(protein * 4 + carbs * 4 + fat * 9);

function findFoodName(name: string): string | null {
  const normalized = normalizeName(name);
  return FOOD_NAMES.find((foodName) => normalizeName(foodName) === normalized)
    || FOOD_NAMES.find((foodName) => normalizeName(foodName).includes(normalized) || normalized.includes(normalizeName(foodName)))
    || null;
}

function buildFood(name: string, grams: number): DietFood | null {
  const foodName = findFoodName(name);
  if (!foodName) return null;

  const source = FOOD_MAP.get(foodName)!;
  const factor = Math.max(0, Number(grams) || 0) / 100;
  const protein = round1(source.protein * factor);
  const carbs = round1(source.carbs * factor);
  const fat = round1(source.fat * factor);

  return {
    name: foodName,
    grams: Math.round(Math.max(0, Number(grams) || 0)),
    protein,
    carbs,
    fat,
    // Calorias calculadas pela regra dos macros, para bater 100% com P/C/G.
    kcal: kcalFromMacros(protein, carbs, fat),
  };
}

function sumFoods(foods: DietFood[]): FoodMacro {
  const protein = round1(foods.reduce((sum, f) => sum + f.protein, 0));
  const carbs = round1(foods.reduce((sum, f) => sum + f.carbs, 0));
  const fat = round1(foods.reduce((sum, f) => sum + f.fat, 0));
  return { protein, carbs, fat, kcal: kcalFromMacros(protein, carbs, fat) };
}

// Categoria dominante de cada alimento para encontrar substitutos equivalentes.
const FOOD_CATEGORY: Record<string, "carbs" | "protein" | "fat" | "vegetable" | "fruit" | "dairy"> = {
  "Arroz integral": "carbs", "Arroz branco": "carbs", "Batata-doce": "carbs",
  "Batata inglesa cozida": "carbs", "Macarrão integral": "carbs", "Pão integral": "carbs",
  "Aveia em flocos": "carbs", "Tapioca": "carbs", "Mandioca cozida": "carbs",
  "Quinoa cozida": "carbs", "Feijão preto cozido": "carbs", "Feijão carioca cozido": "carbs",
  "Grão de bico": "carbs", "Lentilhas": "carbs", "Granola sem açúcar": "carbs",
  "Mel": "carbs", "Torrada integral": "carbs", "Cuscuz": "carbs",
  "Filé de frango grelhado": "protein", "Peito de Frango": "protein",
  "Carne bovina magra": "protein", "Salmão grelhado": "protein", "Atum em água": "protein",
  "Filé de peixe grelhado": "protein", "Camarão grelhado": "protein",
  "Ovo cozido": "protein", "Clara de ovo": "protein", "Peito de peru assado": "protein",
  "Whey Protein Isolado": "protein", "Queijo cottage": "protein",
  "Brócolis cozido": "vegetable", "Espinafre refogado": "vegetable",
  "Couve refogada": "vegetable", "Abobrinha refogada": "vegetable",
  "Cenoura": "vegetable", "Tomate": "vegetable", "Pepino": "vegetable",
  "Banana": "fruit", "Maçã": "fruit", "Morango": "fruit", "Abacaxi": "fruit",
  "Laranja": "fruit", "Mamão": "fruit", "Kiwi": "fruit",
  "Abacate": "fat", "Pasta de amendoim": "fat", "Castanha de caju": "fat",
  "Amêndoas": "fat", "Azeite de oliva": "fat", "Queijo branco": "fat",
  "Iogurte grego natural": "fat",
  "Iogurte natural desnatado": "dairy", "Leite integral": "dairy",
};

function dominantMacroKey(name: string): "carbs" | "protein" | "fat" {
  const cat = FOOD_CATEGORY[name];
  if (cat === "protein") return "protein";
  if (cat === "fat") return "fat";
  return "carbs";
}

type MealType = "cafe" | "lanche" | "almoco_jantar" | "ceia";

function detectMealType(mealName: string): MealType {
  const n = mealName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (n.includes("ceia")) return "ceia";
  if (n.includes("cafe") || n.includes("manha")) return "cafe";
  if (n.includes("almoco") || n.includes("jantar") || n.includes("janta")) return "almoco_jantar";
  return "lanche";
}

// Alimentos considerados adequados a cada momento do dia (evita frango na ceia, atum no café etc.).
const MEAL_ALLOWED: Record<MealType, Set<string>> = {
  cafe: new Set([
    "Aveia em flocos", "Tapioca", "Pão integral", "Torrada integral", "Granola sem açúcar",
    "Cuscuz", "Mel", "Whey Protein Isolado", "Ovo cozido", "Clara de ovo",
    "Queijo cottage", "Queijo branco", "Iogurte natural desnatado", "Iogurte grego natural",
    "Leite integral", "Pasta de amendoim", "Castanha de caju", "Amêndoas", "Abacate",
    "Banana", "Maçã", "Morango", "Mamão", "Kiwi", "Laranja", "Abacaxi",
  ]),
  lanche: new Set([
    "Aveia em flocos", "Tapioca", "Pão integral", "Torrada integral", "Granola sem açúcar",
    "Whey Protein Isolado", "Ovo cozido", "Clara de ovo", "Queijo cottage", "Queijo branco",
    "Iogurte natural desnatado", "Iogurte grego natural", "Leite integral",
    "Pasta de amendoim", "Castanha de caju", "Amêndoas", "Abacate",
    "Banana", "Maçã", "Morango", "Mamão", "Kiwi", "Laranja", "Abacaxi",
  ]),
  almoco_jantar: new Set([
    "Arroz integral", "Arroz branco", "Batata-doce", "Batata inglesa cozida",
    "Macarrão integral", "Mandioca cozida", "Quinoa cozida", "Cuscuz",
    "Feijão preto cozido", "Feijão carioca cozido", "Grão de bico", "Lentilhas",
    "Filé de frango grelhado", "Peito de Frango", "Carne bovina magra",
    "Salmão grelhado", "Atum em água", "Filé de peixe grelhado", "Camarão grelhado",
    "Peito de peru assado", "Ovo cozido",
    "Brócolis cozido", "Espinafre refogado", "Couve refogada", "Abobrinha refogada",
    "Cenoura", "Tomate", "Pepino", "Azeite de oliva",
  ]),
  ceia: new Set([
    "Whey Protein Isolado", "Queijo cottage", "Queijo branco",
    "Iogurte natural desnatado", "Iogurte grego natural", "Leite integral",
    "Clara de ovo", "Ovo cozido",
    "Pasta de amendoim", "Amêndoas", "Castanha de caju", "Abacate",
    "Maçã", "Kiwi", "Mamão",
  ]),
};

function buildVariations(food: DietFood, mealType: MealType): DietVariation[] {
  const category = FOOD_CATEGORY[food.name];
  if (!category) return [];

  const macroKey = dominantMacroKey(food.name);
  const targetMacro = food[macroKey];
  if (targetMacro <= 0) return [];

  const allowed = MEAL_ALLOWED[mealType];
  const alternatives = FOOD_NAMES.filter(
    (n) => n !== food.name && FOOD_CATEGORY[n] === category && allowed.has(n),
  );

  const variations: DietVariation[] = [];
  for (const altName of alternatives) {
    const source = FOOD_MAP.get(altName)!;
    const per100 = source[macroKey];
    if (per100 <= 0.1) continue;
    const grams = Math.round((targetMacro / per100) * 100);
    if (grams < 5 || grams > 500) continue;
    variations.push({ name: altName, grams });
    if (variations.length >= 3) break;
  }
  return variations;
}

function attachVariations(plan: DietPlan): DietPlan {
  plan.meals.forEach((meal) => {
    const mealType = detectMealType(meal.name);
    meal.foods.forEach((food) => {
      food.variations = buildVariations(food, mealType);
    });
  });
  return plan;
}

function normalizeDietPlan(plan: DietPlan): DietPlan | null {
  if (!plan?.meals?.length) return null;

  const meals = plan.meals.map((meal) => {
    const foods = (meal.foods || [])
      .map((food) => buildFood(food.name, food.grams))
      .filter((food): food is DietFood => Boolean(food));

    return {
      name: meal.name || "Refeição",
      time: meal.time || "--:--",
      emoji: meal.emoji || "🍽️",
      foods,
      subtotal: sumFoods(foods),
    };
  }).filter((meal) => meal.foods.length > 0);

  if (!meals.length) return null;
  const allFoods = meals.flatMap((meal) => meal.foods);
  return {
    meals,
    totals: sumFoods(allFoods),
    tips: Array.isArray(plan.tips) ? plan.tips.filter((tip) => !/água|agua|hidrata/i.test(tip)).slice(0, 4) : [],
  };
}

function isPlanValid(plan: DietPlan, lead: Record<string, unknown>) {
  const targetProtein = Number(lead.proteina_g) || 0;
  const targetCarbs = Number(lead.carboidrato_g) || 0;
  const targetFat = Number(lead.gordura_g) || 0;
  const targetKcal = kcalFromMacros(targetProtein, targetCarbs, targetFat);

  // Carboidratos são limite máximo estrito. Proteína/gordura/calorias aceitam pequena margem prática.
  return plan.totals.carbs <= targetCarbs + 0.5
    && Math.abs(plan.totals.protein - targetProtein) <= 8
    && Math.abs(plan.totals.fat - targetFat) <= 6
    && Math.abs(plan.totals.kcal - targetKcal) <= 90;
}

const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function createCalculatedDiet(lead: Record<string, unknown>, tips: string[] = []): DietPlan {
  const targetProtein = Number(lead.proteina_g) || 120;
  const targetCarbs = Number(lead.carboidrato_g) || 120;
  const targetFat = Number(lead.gordura_g) || 50;

  const meals: DietMeal[] = [
    { name: "Café da Manhã", time: "07:00", emoji: "☕", foods: [], subtotal: { kcal: 0, protein: 0, carbs: 0, fat: 0 } },
    { name: "Lanche da Manhã", time: "10:00", emoji: "🥣", foods: [], subtotal: { kcal: 0, protein: 0, carbs: 0, fat: 0 } },
    { name: "Almoço", time: "13:00", emoji: "🍛", foods: [], subtotal: { kcal: 0, protein: 0, carbs: 0, fat: 0 } },
    { name: "Lanche da Tarde", time: "16:30", emoji: "🥤", foods: [], subtotal: { kcal: 0, protein: 0, carbs: 0, fat: 0 } },
    { name: "Jantar", time: "20:00", emoji: "🍽️", foods: [], subtotal: { kcal: 0, protein: 0, carbs: 0, fat: 0 } },
    { name: "Ceia", time: "22:30", emoji: "🌙", foods: [], subtotal: { kcal: 0, protein: 0, carbs: 0, fat: 0 } },
  ];

  const add = (mealIndex: number, name: string, grams: number) => {
    const food = buildFood(name, grams);
    if (food && food.grams > 0) meals[mealIndex].foods.push(food);
  };
  const totals = () => sumFoods(meals.flatMap((meal) => meal.foods));
  const foodCarbsPerGram = (name: string) => (FOOD_MAP.get(name)?.carbs || 0) / 100;
  const foodProteinPerGram = (name: string) => (FOOD_MAP.get(name)?.protein || 0) / 100;

  // Fontes escolhidas aleatoriamente para gerar variação entre dietas.
  const breakfastProtein = pickRandom(["Whey Protein Isolado", "Ovo cozido", "Queijo cottage", "Iogurte grego natural"]);
  const breakfastCarb = pickRandom(["Aveia em flocos", "Tapioca", "Pão integral", "Torrada integral", "Cuscuz"]);
  const lunchCarb = pickRandom(["Arroz branco", "Arroz integral", "Macarrão integral", "Mandioca cozida", "Quinoa cozida", "Cuscuz"]);
  const dinnerCarb = pickRandom(["Batata-doce", "Batata inglesa cozida", "Arroz integral", "Quinoa cozida", "Mandioca cozida"]);
  const lunchProtein = pickRandom(["Peito de Frango", "Filé de frango grelhado", "Carne bovina magra", "Peito de peru assado"]);
  const dinnerProtein = pickRandom(["Filé de peixe grelhado", "Salmão grelhado", "Camarão grelhado", "Peito de peru assado", "Peito de Frango"]);
  const ceiaProtein = pickRandom(["Whey Protein Isolado", "Queijo cottage", "Iogurte grego natural", "Clara de ovo"]);
  const lunchVeg = pickRandom(["Brócolis cozido", "Espinafre refogado", "Couve refogada"]);
  const dinnerVeg = pickRandom(["Abobrinha refogada", "Brócolis cozido", "Espinafre refogado", "Couve refogada"]);

  // Base enxuta para manter vitaminas/fibras sem estourar carboidratos.
  const wheyGrams = targetProtein >= 120 ? 30 : 22;
  if (breakfastProtein === "Whey Protein Isolado") add(0, breakfastProtein, wheyGrams);
  else if (breakfastProtein === "Ovo cozido") add(0, breakfastProtein, 100);
  else add(0, breakfastProtein, 120);

  add(2, lunchVeg, targetCarbs <= 80 ? 50 : 80);
  add(4, dinnerVeg, targetCarbs <= 80 ? 70 : 100);
  add(4, "Tomate", 60);

  // Lanches: fruta + gordura boa (variados a cada geração)
  const morningFruit = pickRandom(["Banana", "Maçã", "Morango", "Mamão", "Kiwi", "Abacaxi", "Laranja"]);
  const afternoonSnack = pickRandom(["Iogurte grego natural", "Iogurte natural desnatado", "Queijo cottage"]);
  const nutChoice = pickRandom(["Amêndoas", "Castanha de caju", "Pasta de amendoim"]);
  add(1, morningFruit, 100);
  add(1, nutChoice, 15);
  add(3, afternoonSnack, 120);

  // Carboidratos: calculados para nunca ultrapassar o alvo.
  let remainingCarbs = Math.max(0, targetCarbs - totals().carbs);
  const breakfastCarbGrams = Math.floor(Math.min(50, remainingCarbs * 0.22 / foodCarbsPerGram(breakfastCarb)));
  add(0, breakfastCarb, breakfastCarbGrams);

  remainingCarbs = Math.max(0, targetCarbs - totals().carbs);
  const lunchCarbGrams = Math.floor(Math.max(0, remainingCarbs * 0.55 / foodCarbsPerGram(lunchCarb)));
  add(2, lunchCarb, lunchCarbGrams);

  remainingCarbs = Math.max(0, targetCarbs - totals().carbs);
  const dinnerCarbGrams = Math.floor(Math.max(0, remainingCarbs / foodCarbsPerGram(dinnerCarb)));
  add(2, dinnerCarb, dinnerCarbGrams);

  // Proteína: completa o alvo com fontes magras, sem adicionar carboidratos relevantes.
  let remainingProtein = Math.max(0, targetProtein - totals().protein);
  add(2, lunchProtein, Math.floor((remainingProtein * 0.45) / foodProteinPerGram(lunchProtein)));
  remainingProtein = Math.max(0, targetProtein - totals().protein);
  add(4, dinnerProtein, Math.floor((remainingProtein * 0.45) / foodProteinPerGram(dinnerProtein)));
  remainingProtein = Math.max(0, targetProtein - totals().protein);
  add(5, ceiaProtein, Math.ceil(remainingProtein / foodProteinPerGram(ceiaProtein)));

  // Gorduras: azeite permite ajuste exato sem mexer em carboidratos.
  let remainingFat = Math.max(0, targetFat - totals().fat);
  add(2, "Azeite de oliva", Math.floor(remainingFat * 0.55));
  remainingFat = Math.max(0, targetFat - totals().fat);
  add(4, "Azeite de oliva", Math.ceil(remainingFat));

  // Segurança final: se arredondamento passou carboidrato, reduz fontes de carboidrato grama por grama.
  const carbFoodsToTrim = [dinnerCarb, lunchCarb, breakfastCarb, morningFruit];
  for (const foodName of carbFoodsToTrim) {
    while (totals().carbs > targetCarbs + 0.1) {
      const food = meals.flatMap((meal) => meal.foods).find((item) => item.name === foodName && item.grams > 0);
      if (!food) break;
      food.grams -= 1;
      const recalculated = buildFood(food.name, food.grams);
      if (recalculated) Object.assign(food, recalculated);
      else break;
    }
  }

  meals.forEach((meal) => {
    meal.foods = meal.foods.filter((food) => food.grams > 0);
    meal.subtotal = sumFoods(meal.foods);
  });

  const defaultTips = [
    "Pese os alimentos já preparados para manter as porções consistentes.",
    "Mantenha horários parecidos todos os dias para facilitar adesão ao plano.",
    "Se sentir fome fora do plano, priorize vegetais com baixo teor calórico.",
  ];

  return {
    meals: meals.filter((meal) => meal.foods.length > 0),
    totals: totals(),
    tips: (tips.length ? tips : defaultTips).filter((tip) => !/água|agua|hidrata/i.test(tip)).slice(0, 4),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lead } = await req.json();

    // Geração 100% determinística e randomizada localmente — garante variedade
    // entre dietas e precisão absoluta nos macros/calorias.
    const dietPlan = attachVariations(createCalculatedDiet(lead));

    return new Response(JSON.stringify({ diet: dietPlan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-diet error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
