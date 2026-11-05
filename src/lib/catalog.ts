export type BasketCategory="basic"|"economic"|"traditional"|"complete";
export type CatalogItem={name:string;quantity:number;unit:string};
export type CatalogBasket={
 id:string;name:string;slug:string;category:BasketCategory;description:string;
 price_cents:number;image_url:string;supported_households:string[];food_tags:string[];
 items:CatalogItem[];active:boolean;position:number;highlight?:string;
};

export const STARTER_BASKETS:CatalogBasket[]=[
 {
  id:"starter-basica",name:"Cesta Básica",slug:"cesta-basica",category:"basic",
  description:"O essencial para reforçar a despensa com os alimentos mais usados no dia a dia.",
  price_cents:9990,image_url:"/images/baskets/basica.svg",supported_households:["1 pessoa","2 pessoas"],
  food_tags:["Arroz e feijão","Massas e molhos","Óleo e temperos"],position:1,
  items:[
   {name:"Arroz tipo 1",quantity:1,unit:"pacote de 2 kg"},
   {name:"Feijão carioca",quantity:1,unit:"pacote de 1 kg"},
   {name:"Óleo de soja",quantity:1,unit:"garrafa de 900 ml"},
   {name:"Açúcar",quantity:1,unit:"pacote de 1 kg"},
   {name:"Macarrão",quantity:1,unit:"pacote de 500 g"},
   {name:"Molho de tomate",quantity:1,unit:"sachê de 300 g"},
   {name:"Farinha de trigo",quantity:1,unit:"pacote de 1 kg"},
   {name:"Sal refinado",quantity:1,unit:"pacote de 1 kg"},
   {name:"Biscoito cream cracker",quantity:1,unit:"pacote de 170 g"},
   {name:"Sardinha",quantity:1,unit:"lata de 125 g"}
  ],active:true
 },
 {
  id:"starter-economica",name:"Cesta Econômica",slug:"cesta-economica",category:"economic",
  description:"Mais unidades dos itens de maior giro, com uma seleção equilibrada para economizar.",
  price_cents:12990,image_url:"/images/baskets/economica.svg",supported_households:["1 pessoa","2 pessoas","3 a 4 pessoas"],
  food_tags:["Arroz e feijão","Massas e molhos","Café e açúcar","Óleo e temperos","Biscoitos e complementos"],
  position:2,highlight:"Bom custo-benefício",
  items:[
   {name:"Arroz tipo 1",quantity:1,unit:"pacote de 5 kg"},
   {name:"Feijão carioca",quantity:2,unit:"pacotes de 1 kg"},
   {name:"Óleo de soja",quantity:1,unit:"garrafa de 900 ml"},
   {name:"Açúcar",quantity:2,unit:"pacotes de 1 kg"},
   {name:"Macarrão",quantity:2,unit:"pacotes de 500 g"},
   {name:"Molho de tomate",quantity:2,unit:"sachês de 300 g"},
   {name:"Farinha de trigo",quantity:1,unit:"pacote de 1 kg"},
   {name:"Fubá",quantity:1,unit:"pacote de 500 g"},
   {name:"Café em pó",quantity:1,unit:"pacote de 250 g"},
   {name:"Leite UHT",quantity:2,unit:"caixas de 1 litro"},
   {name:"Biscoito cream cracker",quantity:2,unit:"pacotes de 170 g"},
   {name:"Sal refinado",quantity:1,unit:"pacote de 1 kg"},
   {name:"Ervilha",quantity:1,unit:"lata de 170 g"},
   {name:"Sardinha",quantity:1,unit:"lata de 125 g"}
  ],active:true
 },
 {
  id:"starter-tradicional",name:"Cesta Tradicional",slug:"cesta-tradicional",category:"traditional",
  description:"Uma compra mais reforçada, com variedade de mercearia para a rotina da família.",
  price_cents:18990,image_url:"/images/baskets/tradicional.svg",supported_households:["2 pessoas","3 a 4 pessoas","5 pessoas ou mais"],
  food_tags:["Arroz e feijão","Massas e molhos","Café e açúcar","Óleo e temperos","Biscoitos e complementos"],
  position:3,highlight:"Equilíbrio entre variedade e quantidade",
  items:[
   {name:"Arroz tipo 1",quantity:1,unit:"pacote de 5 kg"},
   {name:"Feijão carioca",quantity:2,unit:"pacotes de 1 kg"},
   {name:"Óleo de soja",quantity:2,unit:"garrafas de 900 ml"},
   {name:"Açúcar",quantity:2,unit:"pacotes de 1 kg"},
   {name:"Macarrão",quantity:3,unit:"pacotes de 500 g"},
   {name:"Molho de tomate",quantity:3,unit:"sachês de 300 g"},
   {name:"Farinha de trigo",quantity:1,unit:"pacote de 1 kg"},
   {name:"Fubá",quantity:1,unit:"pacote de 500 g"},
   {name:"Café em pó",quantity:1,unit:"pacote de 500 g"},
   {name:"Leite UHT",quantity:3,unit:"caixas de 1 litro"},
   {name:"Biscoito cream cracker",quantity:2,unit:"pacotes de 170 g"},
   {name:"Sardinha",quantity:2,unit:"latas de 125 g"},
   {name:"Sal refinado",quantity:1,unit:"pacote de 1 kg"},
   {name:"Ervilha",quantity:2,unit:"latas de 170 g"},
   {name:"Milho verde",quantity:2,unit:"latas de 170 g"},
   {name:"Aveia",quantity:1,unit:"pacote de 500 g"},
   {name:"Lentilha",quantity:1,unit:"pacote de 500 g"},
   {name:"Biscoito doce",quantity:1,unit:"pacote de 200 g"}
  ],active:true
 },
 {
  id:"starter-completa",name:"Cesta Completa",slug:"cesta-completa",category:"complete",
  description:"Nossa seleção mais robusta, com mais itens e quantidades para uma despensa bem abastecida.",
  price_cents:21990,image_url:"/images/baskets/completa.svg",supported_households:["3 a 4 pessoas","5 pessoas ou mais"],
  food_tags:["Arroz e feijão","Massas e molhos","Café e açúcar","Óleo e temperos","Biscoitos e complementos"],
  position:4,highlight:"Maior variedade",
  items:[
   {name:"Arroz tipo 1",quantity:2,unit:"pacotes de 5 kg"},
   {name:"Feijão carioca",quantity:3,unit:"pacotes de 1 kg"},
   {name:"Óleo de soja",quantity:2,unit:"garrafas de 900 ml"},
   {name:"Açúcar",quantity:3,unit:"pacotes de 1 kg"},
   {name:"Macarrão",quantity:4,unit:"pacotes de 500 g"},
   {name:"Molho de tomate",quantity:4,unit:"sachês de 300 g"},
   {name:"Farinha de trigo",quantity:2,unit:"pacotes de 1 kg"},
   {name:"Fubá",quantity:2,unit:"pacotes de 500 g"},
   {name:"Café em pó",quantity:1,unit:"pacote de 500 g"},
   {name:"Leite UHT",quantity:4,unit:"caixas de 1 litro"},
   {name:"Biscoito cream cracker",quantity:3,unit:"pacotes de 170 g"},
   {name:"Biscoito doce",quantity:2,unit:"pacotes de 200 g"},
   {name:"Sardinha",quantity:3,unit:"latas de 125 g"},
   {name:"Sal refinado",quantity:1,unit:"pacote de 1 kg"},
   {name:"Ervilha",quantity:2,unit:"latas de 170 g"},
   {name:"Milho verde",quantity:2,unit:"latas de 170 g"},
   {name:"Aveia",quantity:1,unit:"pacote de 500 g"},
   {name:"Lentilha",quantity:2,unit:"pacotes de 500 g"},
   {name:"Amido de milho",quantity:1,unit:"pacote de 200 g"},
   {name:"Mistura para bolo",quantity:2,unit:"pacotes de 400 g"},
   {name:"Gelatina",quantity:2,unit:"caixinhas de 20 g"},
   {name:"Extrato de tomate",quantity:2,unit:"latas de 140 g"}
  ],active:true
 }
];

export function formatBRL(cents:number){
 return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);
}
export function getStarterBasket(slug:string){
 return STARTER_BASKETS.find((basket)=>basket.slug===slug);
}
