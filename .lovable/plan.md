

## Marombiew Calc — Calculadora de TMB

### Visão Geral
Calculadora de TMB (Mifflin-St Jeor) com fluxo por etapas, tema dark com amarelo, logo Marombiew, e armazenamento no banco de dados via Lovable Cloud.

### Fluxo por Etapas (Wizard)

**Etapa 1 — Dados Pessoais**
- Nome completo
- Número WhatsApp

**Etapa 2 — Dados Físicos**
- Sexo (Masculino / Feminino)
- Idade
- Peso (kg)
- Altura (cm)

**Etapa 3 — Nível de Atividade**
- Sedentário
- Levemente ativo (1-3x/semana)
- Moderadamente ativo (3-5x/semana)
- Muito ativo (6-7x/semana)
- Extremamente ativo (2x/dia)

**Etapa 4 — Objetivo**
- Emagrecimento (déficit calórico ~20%)
- Hipertrofia (superávit calórico ~15%)

**Etapa 5 — Resultado**
- TMB calculada (Mifflin-St Jeor)
- Calorias diárias ajustadas ao objetivo
- Macros (proteína, carboidrato, gordura) em gramas e percentual
- Botão "Quero minha dieta clicada!" → redireciona para WhatsApp (+351939184666) com mensagem pré-preenchida com nome e objetivo

### Design
- Tema **dark** com acentos em **amarelo** (#F5C518 inspirado no logo)
- Logo Marombiew no topo de cada etapa
- Barra de progresso entre etapas
- Cards com bordas amarelas, fundo escuro

### Backend (Lovable Cloud)
- Tabela `calculator_leads` com: nome, whatsapp, sexo, idade, peso, altura, nível de atividade, objetivo, calorias calculadas, macros, data de acesso
- Dados salvos ao calcular o resultado

### Fórmula Mifflin-St Jeor
- Homem: TMB = 10 × peso + 6.25 × altura - 5 × idade + 5
- Mulher: TMB = 10 × peso + 6.25 × altura - 5 × idade - 161
- TDEE = TMB × fator de atividade
- Emagrecimento: TDEE × 0.80 | Hipertrofia: TDEE × 1.15

