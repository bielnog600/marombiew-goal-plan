import type { DietPlan, DietLead } from "./dietTypes";

const ATIVIDADE_LABELS: Record<string, string> = {
  sedentario: "Sedentário",
  leve: "Leve (1-3x/sem)",
  moderado: "Moderado (3-5x/sem)",
  muito: "Muito ativo (6-7x/sem)",
  extremo: "Extremo (2x/dia)",
};

export function openDietPDF(lead: DietLead, diet: DietPlan, logoUrl: string) {
  const w = window.open("", "_blank");
  if (!w) return;

  const mealCards = diet.meals
    .map(
      (meal, i) => `
    <div class="meal-card">
      <div class="meal-header">
        <div class="meal-title">
          <span class="meal-emoji">${meal.emoji}</span>
          <div>
            <h3>${meal.name}</h3>
            <span class="meal-time">⏰ ${meal.time}</span>
          </div>
        </div>
        <div class="meal-badge">${meal.subtotal.kcal} kcal</div>
      </div>
      <table class="food-table">
        <thead>
          <tr>
            <th class="food-name-col">Alimento</th>
            <th>Qtd</th>
            <th>Kcal</th>
            <th>Prot</th>
            <th>Carb</th>
            <th>Gord</th>
          </tr>
        </thead>
        <tbody>
          ${meal.foods
            .map(
              (f) => `
          <tr>
            <td class="food-name-col">${f.name}</td>
            <td>${f.grams}g</td>
            <td>${f.kcal}</td>
            <td>${f.protein}g</td>
            <td>${f.carbs}g</td>
            <td>${f.fat}g</td>
          </tr>`
            )
            .join("")}
        </tbody>
      </table>
      <div class="meal-subtotal">
        <span><b>Subtotal:</b></span>
        <span>${meal.subtotal.kcal} kcal</span>
        <span>P: ${meal.subtotal.protein}g</span>
        <span>C: ${meal.subtotal.carbs}g</span>
        <span>G: ${meal.subtotal.fat}g</span>
      </div>
    </div>`
    )
    .join("");

  const tipsHTML = diet.tips
    .map(
      (tip, i) => `
    <div class="tip-item">
      <span class="tip-num">${i + 1}</span>
      <span>${tip}</span>
    </div>`
    )
    .join("");

  const objetivo = lead.objetivo === "hipertrofia" ? "💪 Hipertrofia" : "🔥 Emagrecimento";
  const atividade = ATIVIDADE_LABELS[lead.nivel_atividade] || lead.nivel_atividade;

  w.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Dieta - ${lead.nome}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Inter', sans-serif;
  color: #1a1a2e;
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.page {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 40px;
}

/* ---- HEADER ---- */
.header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  padding: 28px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.header img {
  height: 48px;
  object-fit: contain;
}
.header h1 {
  font-family: 'Oswald', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #F5C518;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.header-date {
  color: rgba(255,255,255,0.6);
  font-size: 12px;
}

/* ---- PROFILE CARD ---- */
.profile {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}
.profile-item {
  background: #f8f9fc;
  border-radius: 10px;
  padding: 14px 16px;
  border-left: 4px solid #F5C518;
}
.profile-item .label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #8892a4;
  font-weight: 600;
  margin-bottom: 2px;
}
.profile-item .value {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}

/* ---- MACRO SUMMARY ---- */
.macro-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 28px;
}
.macro-card {
  flex: 1;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}
.macro-card.kcal  { background: linear-gradient(135deg, #F5C518, #f0b400); color: #1a1a2e; }
.macro-card.prot  { background: linear-gradient(135deg, #e74c3c, #c0392b); color: #fff; }
.macro-card.carb  { background: linear-gradient(135deg, #3498db, #2980b9); color: #fff; }
.macro-card.fat   { background: linear-gradient(135deg, #2ecc71, #27ae60); color: #fff; }
.macro-card .macro-val {
  font-family: 'Oswald', sans-serif;
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
}
.macro-card .macro-unit {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 2px;
}
.macro-card .macro-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 4px;
  font-weight: 600;
  opacity: 0.8;
}

/* ---- MEAL CARDS ---- */
.meal-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
  page-break-inside: avoid;
}
.meal-header {
  background: #f8f9fc;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e8ecf1;
}
.meal-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.meal-emoji {
  font-size: 24px;
}
.meal-title h3 {
  font-family: 'Oswald', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.meal-time {
  font-size: 11px;
  color: #8892a4;
}
.meal-badge {
  background: #F5C518;
  color: #1a1a2e;
  font-family: 'Oswald', sans-serif;
  font-weight: 700;
  font-size: 14px;
  padding: 6px 14px;
  border-radius: 20px;
}

/* ---- FOOD TABLE ---- */
.food-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.food-table thead tr {
  background: #f0f2f7;
}
.food-table th {
  padding: 8px 12px;
  text-align: center;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #8892a4;
  font-weight: 600;
}
.food-table th.food-name-col,
.food-table td.food-name-col {
  text-align: left;
  padding-left: 18px;
}
.food-table td {
  padding: 10px 12px;
  text-align: center;
  border-bottom: 1px solid #f0f2f7;
  color: #3d4455;
}
.food-table td.food-name-col {
  font-weight: 500;
  color: #1a1a2e;
}
.food-table tbody tr:last-child td {
  border-bottom: none;
}

.meal-subtotal {
  background: #1a1a2e;
  color: #F5C518;
  padding: 10px 18px;
  display: flex;
  gap: 16px;
  font-size: 12px;
  font-weight: 500;
}

/* ---- TOTALS ---- */
.totals-section {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-radius: 14px;
  padding: 24px 28px;
  margin: 24px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.totals-title {
  font-family: 'Oswald', sans-serif;
  color: #F5C518;
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.totals-values {
  display: flex;
  gap: 20px;
}
.totals-values .tv {
  text-align: center;
}
.totals-values .tv-num {
  font-family: 'Oswald', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}
.totals-values .tv-label {
  font-size: 10px;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ---- TIPS ---- */
.tips-section {
  margin-bottom: 20px;
}
.tips-header {
  font-family: 'Oswald', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  background: #f8f9fc;
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #3d4455;
  line-height: 1.5;
}
.tip-num {
  background: #F5C518;
  color: #1a1a2e;
  width: 22px;
  height: 22px;
  min-width: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 11px;
}

/* ---- FOOTER ---- */
.footer {
  text-align: center;
  padding: 16px;
  border-top: 2px solid #F5C518;
  margin-top: 16px;
  font-size: 10px;
  color: #aab;
  letter-spacing: 0.5px;
}

@media print {
  body { background: #fff; }
  .page { padding: 16px 24px; }
  .meal-card { page-break-inside: avoid; }
}
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-left">
      <img src="${logoUrl}" alt="Marombiew" />
      <div>
        <h1>Plano Alimentar</h1>
        <div class="header-date">${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>
      </div>
    </div>
  </div>

  <div class="profile">
    <div class="profile-item">
      <div class="label">Aluno</div>
      <div class="value">${lead.nome}</div>
    </div>
    <div class="profile-item">
      <div class="label">Objetivo</div>
      <div class="value">${objetivo}</div>
    </div>
    <div class="profile-item">
      <div class="label">Dados</div>
      <div class="value">${lead.sexo === "masculino" ? "♂" : "♀"} ${lead.idade}a · ${lead.peso}kg · ${lead.altura}cm</div>
    </div>
    <div class="profile-item">
      <div class="label">Atividade</div>
      <div class="value">${atividade}</div>
    </div>
  </div>

  <div class="macro-bar">
    <div class="macro-card kcal">
      <div class="macro-val">${diet.totals.kcal}</div>
      <div class="macro-unit">kcal</div>
      <div class="macro-label">Calorias</div>
    </div>
    <div class="macro-card prot">
      <div class="macro-val">${diet.totals.protein}</div>
      <div class="macro-unit">gramas</div>
      <div class="macro-label">Proteína</div>
    </div>
    <div class="macro-card carb">
      <div class="macro-val">${diet.totals.carbs}</div>
      <div class="macro-unit">gramas</div>
      <div class="macro-label">Carboidrato</div>
    </div>
    <div class="macro-card fat">
      <div class="macro-val">${diet.totals.fat}</div>
      <div class="macro-unit">gramas</div>
      <div class="macro-label">Gordura</div>
    </div>
  </div>

  ${mealCards}

  <div class="totals-section">
    <div class="totals-title">Total do Dia</div>
    <div class="totals-values">
      <div class="tv"><div class="tv-num">${diet.totals.kcal}</div><div class="tv-label">kcal</div></div>
      <div class="tv"><div class="tv-num">${diet.totals.protein}g</div><div class="tv-label">Proteína</div></div>
      <div class="tv"><div class="tv-num">${diet.totals.carbs}g</div><div class="tv-label">Carboidrato</div></div>
      <div class="tv"><div class="tv-num">${diet.totals.fat}g</div><div class="tv-label">Gordura</div></div>
    </div>
  </div>

  <div class="tips-section">
    <div class="tips-header">💡 Dicas</div>
    ${tipsHTML}
  </div>

  <div class="footer">
    MAROMBIEW · Plano alimentar personalizado · Consulte um nutricionista para ajustes individuais
  </div>

</div>
</body>
</html>`);

  w.document.close();
  w.onload = () => w.print();
}
