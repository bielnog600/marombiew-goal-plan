export type DietFood = {
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type DietMeal = {
  name: string;
  time: string;
  emoji: string;
  foods: DietFood[];
  subtotal: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
};

export type DietPlan = {
  meals: DietMeal[];
  totals: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  tips: string[];
};

export type DietLead = {
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
