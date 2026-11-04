export type QuizAnswers = {
  household?: string;
  goal?: string;
  foods?: string[];
  budget?: string;
  frequency?: string;
  basket?: string;
  cep?: string;
};

export type BasketCandidate = {
  id: string;
  name: string;
  category: "economic" | "traditional" | "complete";
  priceCents: number;
  active: boolean;
  supportedHouseholds?: string[];
  foodTags?: string[];
};

export type RankedBasket = {
  basket: BasketCandidate;
  score: number;
  reasons: string[];
};

const budgetRanges: Record<string, [number, number]> = {
  "Até R$ 150": [0, 15000],
  "R$ 151 a R$ 250": [15100, 25000],
  "R$ 251 a R$ 350": [25100, 35000],
  "Acima de R$ 350": [35001, Number.POSITIVE_INFINITY],
};

const goalCategories: Record<string, BasketCandidate["category"]> = {
  Economizar: "economic",
  "Itens essenciais": "traditional",
  Variedade: "complete",
};

const basketCategories: Record<string, BasketCandidate["category"]> = {
  Econômica: "economic",
  Tradicional: "traditional",
  Completa: "complete",
};

export function rankBaskets(
  baskets: BasketCandidate[],
  answers: QuizAnswers,
): RankedBasket[] {
  return baskets
    .filter((basket) => basket.active)
    .map((basket) => {
      let score = 0;
      const reasons: string[] = [];
      const range = answers.budget ? budgetRanges[answers.budget] : undefined;

      if (range) {
        if (basket.priceCents >= range[0] && basket.priceCents <= range[1]) {
          score += 35;
          reasons.push("Dentro da faixa de orçamento informada");
        } else if (basket.priceCents > range[1]) {
          score -= 15;
        } else {
          score += 20;
          reasons.push("Preço abaixo do limite do seu orçamento");
        }
      }

      const goalCategory = answers.goal ? goalCategories[answers.goal] : undefined;
      if (goalCategory && basket.category === goalCategory) {
        score += 25;
        reasons.push("Combina com sua prioridade de compra");
      }

      if (
        answers.household &&
        basket.supportedHouseholds?.includes(answers.household)
      ) {
        score += 20;
        reasons.push("Indicada para o tamanho da sua família");
      }

      const selectedFoods = answers.foods ?? [];
      const tags = basket.foodTags ?? [];
      if (selectedFoods.length && tags.length) {
        const matched = selectedFoods.filter((food) => tags.includes(food)).length;
        if (matched) {
          score += Math.round((15 * matched) / selectedFoods.length);
          reasons.push("Contém grupos de alimentos que você selecionou");
        }
      }

      const preferredCategory = answers.basket
        ? basketCategories[answers.basket]
        : undefined;
      if (preferredCategory && basket.category === preferredCategory) {
        score += 5;
        reasons.push("Corresponde ao tipo de cesta escolhido");
      }

      return { basket, score: Math.max(0, score), reasons };
    })
    .sort((a, b) => b.score - a.score || a.basket.priceCents - b.basket.priceCents);
}

export function recommendBaskets(
  baskets: BasketCandidate[],
  answers: QuizAnswers,
): BasketCandidate[] {
  return rankBaskets(baskets, answers).map((entry) => entry.basket);
}
