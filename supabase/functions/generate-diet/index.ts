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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const { lead } = await req.json();

    const prompt = `Você é um nutricionista esportivo especialista. Crie um plano alimentar COMPLETO e PERSONALIZADO para o seguinte aluno:

DADOS DO ALUNO:
- Nome: ${lead.nome}
- Sexo: ${lead.sexo === "masculino" ? "Masculino" : "Feminino"}
- Idade: ${lead.idade} anos
- Peso: ${lead.peso} kg
- Altura: ${lead.altura} cm
- Nível de atividade: ${lead.nivel_atividade}
- Objetivo: ${lead.objetivo === "hipertrofia" ? "Ganho de massa muscular (Hipertrofia)" : "Emagrecimento (Perda de gordura)"}
- TMB: ${lead.tmb} kcal
- TDEE: ${lead.tdee} kcal
- Meta calórica diária: ${lead.calorias_ajustadas} kcal
- Proteína: ${lead.proteina_g}g/dia
- Carboidrato: ${lead.carboidrato_g}g/dia
- Gordura: ${lead.gordura_g}g/dia

${FOODS_DB}

INSTRUÇÕES:
1. Monte 5-6 refeições por dia (café da manhã, lanche da manhã, almoço, lanche da tarde, jantar, ceia opcional)
2. Use APENAS alimentos da lista acima
3. Indique as QUANTIDADES em gramas para cada alimento
4. Os macros totais devem bater com a meta: ${lead.calorias_ajustadas} kcal, ${lead.proteina_g}g P, ${lead.carboidrato_g}g C, ${lead.gordura_g}g G
5. Ao final de cada refeição, mostre o subtotal de kcal, proteína, carboidrato e gordura
6. Ao final, mostre o TOTAL GERAL do dia
7. Inclua dicas práticas para o aluno

FORMATO DE RESPOSTA (use EXATAMENTE este formato):

PLANO ALIMENTAR PERSONALIZADO
Aluno: [nome]
Objetivo: [objetivo]
Meta: [calorias] kcal | P: [x]g | C: [x]g | G: [x]g

---

REFEIÇÃO 1 - CAFÉ DA MANHÃ (horário sugerido: 07:00)
• [Alimento] - [X]g ([kcal] kcal | P: [x]g | C: [x]g | G: [x]g)
• [Alimento] - [X]g ([kcal] kcal | P: [x]g | C: [x]g | G: [x]g)
Subtotal: [kcal] kcal | P: [x]g | C: [x]g | G: [x]g

[... demais refeições ...]

---

TOTAL DO DIA:
Calorias: [x] kcal
Proteína: [x]g
Carboidrato: [x]g
Gordura: [x]g

---

DICAS:
1. [dica]
2. [dica]
3. [dica]`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é um nutricionista esportivo expert. Responda APENAS em português do Brasil. Seja preciso com os cálculos de macronutrientes." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos no workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const dietText = data.choices?.[0]?.message?.content || "Erro ao gerar dieta";

    return new Response(JSON.stringify({ diet: dietText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-diet error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
