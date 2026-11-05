import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { BlobPreconditionFailedError, get as getBlob, put as putBlob } from "@vercel/blob";
import { STARTER_BASKETS } from "@/lib/catalog";
import { DEFAULT_HOME_CONTENT, type HomeContent } from "@/lib/home-content";

export type LocalProduct={id:string;name:string;slug:string;description:string;sku:string|null;price_cents:number;stock_quantity:number;weight_grams:number;width_cm:number;height_cm:number;length_cm:number;image_url:string|null;active:boolean;created_at:string;updated_at:string};
export type LocalBasketItem={product_id:string;quantity:number;unit?:string};
export type LocalBasket={id:string;name:string;slug:string;description:string;price_cents:number;category:"basic"|"economic"|"traditional"|"complete";supported_households:string[];food_tags:string[];image_url:string|null;active:boolean;position:number;basket_items:LocalBasketItem[];created_at:string;updated_at:string};
export type LocalQuizQuestion={id:string;question_key:string;title:string;subtitle:string;options:{value:string;description:string}[];multi:boolean;required:boolean;position:number;active:boolean};
export type LocalOrderItem={product_name:string;sku:string|null;quantity:number;line_total_cents:number};
export type LocalOrder={id:string;order_number:number;idempotency_key:string;customer_name:string;customer_email:string|null;customer_phone:string;cep:string;address:Record<string,unknown>;subtotal_cents:number;shipping_cents:number;total_cents:number;shipping_service:string;payment_status:"pending"|"paid"|"failed"|"refunded"|"chargeback";fulfillment_status:"pending"|"processing"|"shipped"|"delivered"|"cancelled";payment_reference:string|null;payment_payload:{copy_paste?:string;qr_code?:string|null;expires_at?:string}|null;order_items:LocalOrderItem[];created_at:string;updated_at:string;paid_at:string|null};
export type LocalStore={version:1;catalog_pricing_revision:2;products:LocalProduct[];baskets:LocalBasket[];quiz_questions:LocalQuizQuestion[];orders:LocalOrder[];processed_payment_events:string[];next_order_number:number;home_content:HomeContent};

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
 return {version:1,catalog_pricing_revision:2,products,baskets,quiz_questions,orders:[],processed_payment_events:[],next_order_number:1001,home_content:{...DEFAULT_HOME_CONTENT}};
}
function storageFile(){return path.join(process.env.FORTI_STORAGE_DIR||path.join(process.cwd(),"data"),"forticestas.json");}
const BLOB_STORE_PATH="data/forticestas.json";
function isVercelRuntime(){return process.env.VERCEL==="1"||process.env.VERCEL==="true";}
function hasBlobCredentials(){
 return Boolean(process.env.BLOB_READ_WRITE_TOKEN||(process.env.BLOB_STORE_ID&&process.env.VERCEL_OIDC_TOKEN));
}
function normalizeStore(parsed:unknown):LocalStore{
 if(!parsed||typeof parsed!=="object")throw new Error("O armazenamento da FortiCestas retornou dados inválidos.");
 const store=parsed as LocalStore;
 if(store.version!==1||!Array.isArray(store.products)||!Array.isArray(store.baskets)||!Array.isArray(store.orders)||!Array.isArray(store.quiz_questions))throw new Error("O arquivo da FortiCestas tem um formato inválido.");
 store.processed_payment_events=Array.isArray(store.processed_payment_events)?store.processed_payment_events:[];
 store.next_order_number=Number.isInteger(store.next_order_number)?store.next_order_number:1001;
 const savedHomeContent=store.home_content||{};
 store.home_content={...DEFAULT_HOME_CONTENT,...savedHomeContent};
 // Move the original starter hero to the newly designed family photo. Keep custom admin uploads untouched.
 if(!savedHomeContent.hero_image_url||savedHomeContent.hero_image_url==="/images/hero.svg"){
  store.home_content={
   ...store.home_content,
   hero_image_url:"/images/hero-forticestas.svg",
   hero_image_alt:"Família reunida com uma cesta de alimentos FortiCestas",
   hero_image_caption:"FortiCestas",
   hero_image_subtitle:"Cestas básicas para o dia a dia da sua família"
  };
 }
 if(store.catalog_pricing_revision!==2){
  const prices:Record<string,number>={"cesta-basica":9990,"cesta-economica":12990,"cesta-tradicional":18990,"cesta-completa":21990};
  for(const basket of store.baskets){
   const price=prices[basket.slug];
   if(price!==undefined)basket.price_cents=price;
  }
  store.catalog_pricing_revision=2;
 }
 return store;
}
async function loadLocalStore():Promise<LocalStore>{
 try{
  const parsed=JSON.parse(await readFile(storageFile(),"utf8")) as LocalStore;
  const needsMigration=parsed.catalog_pricing_revision!==2;
  const migrated=normalizeStore(parsed);
  if(needsMigration)await persistLocalStore(migrated);
  return migrated;
 }
 catch(error){if((error as NodeJS.ErrnoException).code==="ENOENT")return initialStore();throw error;}
}
async function loadBlobSnapshot():Promise<{store:LocalStore;etag:string|null}>{
 if(!hasBlobCredentials())throw new Error("O Vercel Blob ainda não está conectado. Confira BLOB_READ_WRITE_TOKEN nas variáveis do projeto.");
 const result=await getBlob(BLOB_STORE_PATH,{access:"private",useCache:false});
 if(!result)return {store:initialStore(),etag:null};
 const json=await new Response(result.stream).text();
 const parsed=JSON.parse(json) as LocalStore;
 const needsMigration=parsed.catalog_pricing_revision!==2;
 const store=normalizeStore(parsed);
 let etag=result.blob.etag||null;
 if(needsMigration){
  try{const saved=await saveBlobSnapshot(store,etag);etag=saved.etag;}
  catch(error){if(isBlobConflict(error))return loadBlobSnapshot();throw error;}
 }
 return {store,etag};
}
async function saveBlobSnapshot(store:LocalStore,etag:string|null){
 return putBlob(BLOB_STORE_PATH,JSON.stringify(store),{
  access:"private",
  addRandomSuffix:false,
  allowOverwrite:Boolean(etag),
  contentType:"application/json",
  cacheControlMaxAge:60,
  ...(etag?{ifMatch:etag}:{})
 });
}
let writeQueue:Promise<void>=Promise.resolve();
async function persistLocalStore(store:LocalStore){
 const file=storageFile(),directory=path.dirname(file);await mkdir(directory,{recursive:true});
 const temporary=file+"."+randomUUID()+".tmp";
 await writeFile(temporary,JSON.stringify(store,null,2),{encoding:"utf8",mode:0o600});
 await rename(temporary,file);
}
function isBlobConflict(error:unknown){
 return error instanceof BlobPreconditionFailedError||
  (error instanceof Error&&["BlobPreconditionFailedError","BlobAlreadyExistsError"].includes(error.name));
}
async function updateBlobStore<T>(mutator:(store:LocalStore)=>T|Promise<T>):Promise<T>{
 for(let attempt=0;attempt<6;attempt++){
  const snapshot=await loadBlobSnapshot();
  const result=await mutator(snapshot.store);
  try{
   await saveBlobSnapshot(snapshot.store,snapshot.etag);
   return result;
  }catch(error){
   if(isBlobConflict(error)){
    continue;
   }
   if(!snapshot.etag){
    // Another serverless invocation may have initialized the same store first.
    const latest=await loadBlobSnapshot();
    if(latest.etag)continue;
   }
   throw error;
  }
 }
 throw new Error("O catálogo recebeu alterações simultâneas. Tente salvar novamente.");
}
export async function initializeLocalStore(){
 if(!isVercelRuntime())return loadLocalStore();
 const snapshot=await loadBlobSnapshot();
 if(snapshot.etag)return snapshot.store;
 try{await saveBlobSnapshot(snapshot.store,null);}
 catch(error){
  if(!isBlobConflict(error))throw error;
 }
 return (await loadBlobSnapshot()).store;
}
export async function readLocalStore(){
 if(isVercelRuntime())return (await loadBlobSnapshot()).store;
 return loadLocalStore();
}
export async function updateLocalStore<T>(mutator:(store:LocalStore)=>T|Promise<T>):Promise<T>{
 const operation=writeQueue.then(async()=>{
  if(isVercelRuntime())return updateBlobStore(mutator);
  const store=await loadLocalStore(),result=await mutator(store);
  await persistLocalStore(store);
  return result;
 });
 writeQueue=operation.then(()=>undefined,()=>undefined);
 return operation;
}
export function publicBasket(basket:LocalBasket,store:LocalStore){
 const starter=STARTER_BASKETS.find((item)=>item.slug===basket.slug);
 return {id:basket.id,name:basket.name,slug:basket.slug,description:basket.description,price_cents:basket.price_cents,category:basket.category,supported_households:basket.supported_households,food_tags:basket.food_tags,active:basket.active,position:basket.position,image_url:basket.image_url||starter?.image_url||"/images/hero.svg",
  items:basket.basket_items.map((entry)=>{const product=store.products.find((item)=>item.id===entry.product_id);const original=starter?.items.find((item)=>slugify(item.name)===product?.slug);return {name:product?.name||original?.name||"Item da cesta",quantity:entry.quantity,unit:entry.unit||original?.unit||"unidade(s)"};}),item_count:basket.basket_items.length};
}
export function publicCatalog(store:LocalStore){return store.baskets.filter((basket)=>basket.active).sort((a,b)=>a.position-b.position).map((basket)=>publicBasket(basket,store));}
