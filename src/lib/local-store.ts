import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { STARTER_BASKETS } from "@/lib/catalog";
import { DEFAULT_HOME_CONTENT, type HomeContent } from "@/lib/home-content";

export type LocalProduct={id:string;name:string;slug:string;description:string;sku:string|null;price_cents:number;stock_quantity:number;weight_grams:number;width_cm:number;height_cm:number;length_cm:number;image_url:string|null;active:boolean;created_at:string;updated_at:string};
export type LocalBasketItem={product_id:string;quantity:number;unit?:string};
export type LocalBasket={id:string;name:string;slug:string;description:string;price_cents:number;category:"basic"|"economic"|"traditional"|"complete";supported_households:string[];food_tags:string[];image_url:string|null;active:boolean;position:number;basket_items:LocalBasketItem[];created_at:string;updated_at:string};
export type LocalQuizQuestion={id:string;question_key:string;title:string;subtitle:string;options:{value:string;description:string}[];multi:boolean;required:boolean;position:number;active:boolean};
export type LocalOrderItem={product_name:string;sku:string|null;quantity:number;line_total_cents:number};
export type LocalOrder={id:string;order_number:number;idempotency_key:string;customer_name:string;customer_email:string|null;customer_phone:string;cep:string;address:Record<string,unknown>;subtotal_cents:number;shipping_cents:number;total_cents:number;shipping_service:string;payment_status:"pending"|"paid"|"failed"|"refunded"|"chargeback";fulfillment_status:"pending"|"processing"|"shipped"|"delivered"|"cancelled";payment_reference:string|null;payment_payload:{copy_paste?:string;qr_code?:string|null;expires_at?:string}|null;order_items:LocalOrderItem[];created_at:string;updated_at:string;paid_at:string|null};
export type LocalStore={version:1;products:LocalProduct[];baskets:LocalBasket[];quiz_questions:LocalQuizQuestion[];orders:LocalOrder[];processed_payment_events:string[];next_order_number:number;home_content:HomeContent};

function slugify(value:string){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
function initialStore():LocalStore{
 const now=new Date().toISOString(),products:LocalProduct[]=[],productIds=new Map<string,string>();
 for(const basket of STARTER_BASKETS)for(const item of basket.items){
  const slug=slugify(item.name);if(productIds.has(slug))continue;
  const id="product-"+slug;productIds.set(slug,id);
  products.push({id,name:item.name,slug,description:item.name,sku:null,price_cents:0,stock_quantity:0,weight_grams:0,width_cm:0,height_cm:0,length_cm:0,image_url:null,active:true,created_at:now,updated_at:now});
 }
 const baskets:LocalBasket[]=STARTER_BASKETS.map((basket)=>({
  id:basket.id,name:basket.name,slug:basket.slug,description:basket.description,price_cents:basket.price_cents,category:basket.category,
  supported_households:[...basket.supported_households],food_tags:[...basket.food_tags],image_url:basket.image_url,active:basket.active,position:basket.position,
  basket_items:basket.items.map((item)=>({product_id:productIds.get(slugify(item.name))!,quantity:item.quantity,unit:item.unit})),created_at:now,updated_at:now
 }));
 const quiz_questions:LocalQuizQuestion[]=[
  {id:"question-household",question_key:"household",title:"Quantas pessoas vivem na sua casa?",subtitle:"Vamos considerar o tamanho da sua família para sugerir uma cesta adequada.",options:[{value:"1 pessoa",description:"Uma pessoa"},{value:"2 pessoas",description:"Duas pessoas"},{value:"3 a 4 pessoas",description:"De três a quatro pessoas"},{value:"5 pessoas ou mais",description:"Cinco pessoas ou mais"}],multi:false,required:true,position:1,active:true},
  {id:"question-goal",question_key:"goal",title:"O que é mais importante para você?",subtitle:"Escolha o que melhor representa sua prioridade neste momento.",options:[{value:"Economizar",description:"Quero aproveitar melhor meu orçamento"},{value:"Itens essenciais",description:"Quero garantir o básico em casa"},{value:"Variedade",description:"Quero uma seleção mais completa"}],multi:false,required:true,position:2,active:true},
  {id:"question-foods",question_key:"foods",title:"Quais itens não podem faltar?",subtitle:"Selecione os grupos de alimentos que sua família costuma consumir.",options:[{value:"Arroz e feijão",description:"A base das refeições"},{value:"Massas e molhos",description:"Praticidade durante a semana"},{value:"Café e açúcar",description:"Para a rotina diária"},{value:"Óleo e temperos",description:"Complementos para cozinhar"},{value:"Biscoitos e complementos",description:"Itens para lanches"}],multi:true,required:true,position:3,active:true},
  {id:"question-budget",question_key:"budget",title:"Qual faixa de orçamento você planeja?",subtitle:"Vamos priorizar opções próximas ao valor que pretende investir.",options:[{value:"Até R$ 100",description:"A opção de entrada"},{value:"R$ 101 a R$ 175",description:"Economia com mais variedade"},{value:"R$ 176 a R$ 250",description:"Uma cesta mais reforçada"},{value:"Acima de R$ 250",description:"Quero comparar opções mais completas"}],multi:false,required:true,position:4,active:true},
  {id:"question-frequency",question_key:"frequency",title:"Com que frequência pretende comprar?",subtitle:"Queremos entender o ritmo ideal para sua casa.",options:[{value:"Uma vez",description:"Compra pontual"},{value:"Todo mês",description:"Reposição mensal"},{value:"A cada 15 dias",description:"Reposição quinzenal"}],multi:false,required:true,position:5,active:true},
  {id:"question-basket",question_key:"basket",title:"Qual tipo de cesta prefere?",subtitle:"Escolha o perfil de cesta que mais combina com o que procura.",options:[{value:"Básica",description:"Só o essencial para a despensa"},{value:"Econômica",description:"Mais itens com foco no orçamento"},{value:"Tradicional",description:"Equilíbrio entre quantidade e variedade"},{value:"Completa",description:"Nossa seleção mais robusta"}],multi:false,required:true,position:6,active:true}
 ];
 return {version:1,products,baskets,quiz_questions,orders:[],processed_payment_events:[],next_order_number:1001,home_content:{...DEFAULT_HOME_CONTENT}};
}
function storageFile(){return path.join(process.env.FORTI_STORAGE_DIR||path.join(process.cwd(),"data"),"forticestas.json");}
function isVercelRuntime(){return process.env.VERCEL==="1"||process.env.VERCEL==="true";}
async function loadStore():Promise<LocalStore>{
 try{
  const parsed=JSON.parse(await readFile(storageFile(),"utf8")) as LocalStore;
  if(parsed.version!==1||!Array.isArray(parsed.products)||!Array.isArray(parsed.baskets)||!Array.isArray(parsed.orders))throw new Error("O arquivo local da FortiCestas tem um formato inválido.");
  parsed.home_content={...DEFAULT_HOME_CONTENT,...(parsed.home_content||{})};
  return parsed;
 }catch(error){if((error as NodeJS.ErrnoException).code==="ENOENT")return initialStore();throw error;}
}
let writeQueue:Promise<void>=Promise.resolve();
async function persistStore(store:LocalStore){
 if(isVercelRuntime())throw new Error("O armazenamento local permanente exige um servidor com disco persistente. A Vercel não mantém gravações no disco entre execuções.");
 const file=storageFile(),directory=path.dirname(file);await mkdir(directory,{recursive:true});
 const temporary=file+"."+randomUUID()+".tmp";
 await writeFile(temporary,JSON.stringify(store,null,2),{encoding:"utf8",mode:0o600});
 await rename(temporary,file);
}
export async function readLocalStore(){return loadStore();}
export async function updateLocalStore<T>(mutator:(store:LocalStore)=>T|Promise<T>):Promise<T>{
 const operation=writeQueue.then(async()=>{const store=await loadStore();const result=await mutator(store);await persistStore(store);return result;});
 writeQueue=operation.then(()=>undefined,()=>undefined);return operation;
}
export function publicBasket(basket:LocalBasket,store:LocalStore){
 const starter=STARTER_BASKETS.find((item)=>item.slug===basket.slug);
 return {id:basket.id,name:basket.name,slug:basket.slug,description:basket.description,price_cents:basket.price_cents,category:basket.category,supported_households:basket.supported_households,food_tags:basket.food_tags,active:basket.active,position:basket.position,image_url:basket.image_url||starter?.image_url||"/images/hero.svg",
  items:basket.basket_items.map((entry)=>{const product=store.products.find((item)=>item.id===entry.product_id);const original=starter?.items.find((item)=>slugify(item.name)===product?.slug);return {name:product?.name||original?.name||"Item da cesta",quantity:entry.quantity,unit:entry.unit||original?.unit||"unidade(s)"};}),item_count:basket.basket_items.length};
}
export function publicCatalog(store:LocalStore){return store.baskets.filter((basket)=>basket.active).sort((a,b)=>a.position-b.position).map((basket)=>publicBasket(basket,store));}
