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
  foods?: string[];
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

export function scoreBasket(
  basket: BasketCandidate,
  answers: QuizAnswers,
): number {
  if (!basket.active) return -1;

  let score = 0;
  const range = answers.budget ? budgetRanges[answers.budget] : undefined;

  if (range && basket.priceCents >= range[0] && basket.priceCents <= range[1]) {
    score += 35;
  }

  if (answers.goal && goalCategories[answers.goal] === basket.category) {
    score += 25;
  }

  if (
    answers.household &&
    basket.supportedHouseholds?.includes(answers.household)
  ) {
    score += 20;
  }

  const selectedFoods = answers.foods ?? [];
  if (selectedFoods.length > 0) {
    const matched = selectedFoods.filter((food) =>
      basket.foods?.includes(food),
    ).length;
    score += Math.round((15 * matched) / selectedFoods.length);
  }

  const basketTypes: Record<string, BasketCandidate["category"]> = {
    Econômica: "economic",
    Tradicional: "traditional",
    Completa: "complete",
  };

  if (answers.basket && basketTypes[answers.basket] === basket.category) {
    score += 5;
  }

  return score;
}

export function recommendBaskets(
  baskets: BasketCandidate[],
  answers: QuizAnswers,
): BasketCandidate[] {
  return baskets
    .map((basket) => ({ basket, score: scoreBasket(basket, answers) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score || a.basket.priceCents - b.basket.priceCents)
    .map((entry) => entry.basket);
}
