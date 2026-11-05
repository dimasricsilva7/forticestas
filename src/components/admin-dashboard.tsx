"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {DEFAULT_HOME_CONTENT,type HomeContent} from "@/lib/home-content";

type Product = {
  id: string; name: string; slug: string; description: string; sku: string | null;
  price_cents: number; stock_quantity: number; weight_grams: number; width_cm: number; height_cm: number; length_cm: number; image_url: string | null; active: boolean;
};
type BasketItem = { product_id: string; quantity: number };
type ImageFieldProps = {label:string;value:string;onChange:(value:string)=>void};
type Basket = {
  id: string; name: string; slug: string; description: string; price_cents: number;
  category: "basic" | "economic" | "traditional" | "complete";
  supported_households: string[]; food_tags: string[]; image_url:string|null;
  active: boolean; position: number; basket_items: BasketItem[];
};
type OrderItem = { product_name: string; sku: string | null; quantity: number; line_total_cents: number };
type Order = {
  id: string; order_number: number; customer_name: string; customer_phone: string;
  cep: string; address: {logradouro?:string; bairro?:string; localidade?:string; uf?:string; number?:string; complement?:string};
  total_cents: number; payment_status: string; fulfillment_status: string;
  shipping_service: string | null; created_at: string; order_items: OrderItem[];
};
type ProductForm = {
  id?: string; name: string; slug: string; description: string; sku: string;
  price: string; stock: string; weight_grams: string; width_cm: string; height_cm: string; length_cm: string; image_url: string; active: boolean;
};
type QuizQuestion = {
  id: string; question_key: string; title: string; subtitle: string;
  options: { value: string; description: string }[]; multi: boolean;
  required: boolean; position: number; active: boolean;
};

const emptyProduct: ProductForm = {
  name:"", slug:"", description:"", sku:"", price:"", stock:"0", weight_grams:"500", width_cm:"20", height_cm:"20", length_cm:"20", image_url:"", active:true
};

function ImageField({label,value,onChange}:ImageFieldProps){
 const [uploading,setUploading]=useState(false),[message,setMessage]=useState("");
 async function upload(file?:File){
  if(!file)return;setMessage("");
  if(file.size>8*1024*1024){setMessage("A imagem deve ter no máximo 8 MB.");return;}
  const form=new FormData();form.append("file",file);setUploading(true);
  try{const response=await fetch("/api/admin/media",{method:"POST",body:form});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Falha no envio da imagem.");onChange(data.url);setMessage("Imagem enviada.");}
  catch(error){setMessage(error instanceof Error?error.message:"Não foi possível enviar a imagem.");}
  finally{setUploading(false);}
 }
 return <div className="image-field"><label>{label} — URL<input type="text" inputMode="url" placeholder="https://... ou /api/media/..." value={value} onChange={event=>onChange(event.target.value)}/></label><label>Ou envie um arquivo<input type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" disabled={uploading} onChange={event=>void upload(event.target.files?.[0])}/></label>{uploading&&<small>Enviando imagem...</small>}{message&&<small>{message}</small>}{value&&<Image src={value} alt="Prévia da imagem" width={220} height={140} unoptimized className="image-field-preview"/>}</div>;
}

const homeGroups:{title:string;fields:{key:keyof HomeContent;label:string;multiline?:boolean;image?:boolean}[]}[]=[
 {title:"Identidade visual",fields:[{key:"brand_name",label:"Nome da loja"},{key:"brand_tagline",label:"Subtítulo da marca"},{key:"logo_url",label:"Logo",image:true}]},
 {title:"Cabeçalho e navegação",fields:[{key:"nav_home_label",label:"Texto início"},{key:"nav_home_url",label:"Destino início"},{key:"nav_catalog_label",label:"Texto catálogo"},{key:"nav_catalog_url",label:"Destino catálogo"},{key:"nav_quiz_label",label:"Texto quiz"},{key:"nav_quiz_url",label:"Destino quiz"},{key:"header_button_text",label:"Texto do botão"},{key:"header_button_url",label:"Destino do botão"}]},
 {title:"Banner principal",fields:[{key:"hero_eyebrow",label:"Texto pequeno acima do título"},{key:"hero_title",label:"Título principal"},{key:"hero_highlight",label:"Trecho destacado"},{key:"hero_description",label:"Descrição",multiline:true},{key:"hero_primary_text",label:"Botão principal"},{key:"hero_primary_url",label:"Link do botão principal"},{key:"hero_secondary_text",label:"Botão secundário"},{key:"hero_secondary_url",label:"Link do botão secundário"},{key:"hero_image_url",label:"Imagem principal",image:true},{key:"hero_image_alt",label:"Descrição acessível da imagem"},{key:"hero_image_caption",label:"Legenda da imagem"},{key:"hero_image_subtitle",label:"Subtítulo da legenda"}]},
 {title:"Faixa de confiança",fields:[{key:"trust_one_text",label:"Texto de confiança 1"},{key:"trust_two_text",label:"Texto de confiança 2"},{key:"trust_three_text",label:"Texto de confiança 3"}]},
 {title:"Cards de benefícios",fields:[{key:"benefit_one_icon",label:"Ícone do benefício 1"},{key:"benefit_one_title",label:"Título do benefício 1"},{key:"benefit_one_description",label:"Descrição do benefício 1"},{key:"benefit_two_icon",label:"Ícone do benefício 2"},{key:"benefit_two_title",label:"Título do benefício 2"},{key:"benefit_two_description",label:"Descrição do benefício 2"},{key:"benefit_three_icon",label:"Ícone do benefício 3"},{key:"benefit_three_title",label:"Título do benefício 3"},{key:"benefit_three_description",label:"Descrição do benefício 3"}]},
 {title:"Seção do catálogo",fields:[{key:"catalog_eyebrow",label:"Texto de apoio"},{key:"catalog_title",label:"Título",multiline:true},{key:"catalog_description",label:"Descrição",multiline:true},{key:"catalog_link_text",label:"Texto do link do catálogo"},{key:"catalog_link_url",label:"Destino do link do catálogo"},{key:"basket_card_button_text",label:"Botão de cada cesta"}]},
 {title:"Banner do quiz",fields:[{key:"quiz_banner_title",label:"Título"},{key:"quiz_banner_description",label:"Descrição",multiline:true},{key:"quiz_banner_button_text",label:"Texto do botão"},{key:"quiz_banner_button_url",label:"Link do botão"}]},
 {title:"Rodapé",fields:[{key:"footer_description",label:"Texto do rodapé",multiline:true}]}
];

function currency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" }).format(cents / 100);
}
function toSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type":"application/json", ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Não foi possível concluir a operação.");
  return data as T;
}

export default function AdminDashboard() {
  const [tab,setTab] = useState<"overview"|"home"|"products"|"baskets"|"quiz"|"orders">("overview");
  const [homeContent,setHomeContent]=useState<HomeContent>({...DEFAULT_HOME_CONTENT});
  const [products,setProducts] = useState<Product[]>([]);
  const [questions,setQuestions] = useState<QuizQuestion[]>([]);
  const [baskets,setBaskets] = useState<Basket[]>([]);
  const [orders,setOrders] = useState<Order[]>([]);
  const [overview,setOverview] = useState({products:0,baskets:0,orders:0,paidRevenueCents:0,paidOrders:0});
  const [loading,setLoading] = useState(true);
  const [notice,setNotice] = useState("");
  const [error,setError] = useState("");
  const [productForm,setProductForm] = useState<ProductForm>(emptyProduct);
  const [basketForm,setBasketForm] = useState({
    id:"",name:"",slug:"",description:"",price:"",image_url:"",
    category:"traditional" as "basic"|"economic"|"traditional"|"complete",
    supported_households:[] as string[],food_tags:[] as string[],
    active:true,items:[] as {product_id:string;quantity:number}[]
  });
  const [questionForm,setQuestionForm] = useState({
    id:"", question_key:"", title:"", subtitle:"",
    optionsText: JSON.stringify([{value:"Opção 1",description:"Descrição da opção"},{value:"Opção 2",description:"Descrição da opção"}],null,2),
    multi:false, required:true, position:"1", active:true
  });

  const loadAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [o,p,b,r,q,h] = await Promise.all([
        request<typeof overview>("/api/admin/overview"),
        request<{products:Product[]}>("/api/admin/products"),
        request<{baskets:Basket[]}>("/api/admin/baskets"),
        request<{orders:Order[]}>("/api/admin/orders"),
        request<{questions:QuizQuestion[]}>("/api/admin/quiz-questions"),
        request<{content:HomeContent}>("/api/admin/home-content"),
      ]);
      setOverview(o); setProducts(p.products); setBaskets(b.baskets); setOrders(r.orders); setQuestions(q.questions); setHomeContent(h.content);
    } catch (e) { setError(e instanceof Error ? e.message : "Erro ao carregar o painel."); }
    finally { setLoading(false); }
  },[]);

  useEffect(() => {
    void Promise.resolve().then(() => loadAll());
  },[loadAll]);

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    const price = Number(productForm.price.replace(",","."));
    const payload = {
      name:productForm.name, slug:productForm.slug || toSlug(productForm.name),
      description:productForm.description, sku:productForm.sku || null,
      price_cents:Math.round(price*100), stock_quantity:Number(productForm.stock), weight_grams:Number(productForm.weight_grams), width_cm:Number(productForm.width_cm), height_cm:Number(productForm.height_cm), length_cm:Number(productForm.length_cm),
      image_url:productForm.image_url || null, active:productForm.active
    };
    try {
      if (!Number.isFinite(price) || price < 0) throw new Error("Informe um preço válido.");
      if (productForm.id) await request(`/api/admin/products/${productForm.id}`,{method:"PATCH",body:JSON.stringify(payload)});
      else await request("/api/admin/products",{method:"POST",body:JSON.stringify(payload)});
      setProductForm(emptyProduct); setNotice("Produto salvo."); await loadAll();
    } catch(e) { setError(e instanceof Error ? e.message : "Não foi possível salvar."); }
  }

  function editProduct(product:Product) {
    setProductForm({
      id:product.id,name:product.name,slug:product.slug,description:product.description || "",
      sku:product.sku || "",price:(product.price_cents/100).toFixed(2).replace(".",","),
      stock:String(product.stock_quantity),weight_grams:String(product.weight_grams || 0),width_cm:String(product.width_cm || 0),height_cm:String(product.height_cm || 0),length_cm:String(product.length_cm || 0),image_url:product.image_url || "",active:product.active
    });
    setTab("products"); window.scrollTo({top:0,behavior:"smooth"});
  }

  async function deleteProduct(product:Product) {
    if (!window.confirm(`Excluir o produto "${product.name}"?`)) return;
    try { await request(`/api/admin/products/${product.id}`,{method:"DELETE"}); setNotice("Produto excluído."); await loadAll(); }
    catch(e) { setError(e instanceof Error ? e.message : "Não foi possível excluir."); }
  }

  async function saveBasket(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    const price = Number(basketForm.price.replace(",","."));
    const payload = {
      name:basketForm.name,slug:basketForm.slug || toSlug(basketForm.name),
      description:basketForm.description,price_cents:Math.round(price*100),image_url:basketForm.image_url||null,
      category:basketForm.category,
      supported_households:basketForm.supported_households,
      food_tags:basketForm.food_tags,
      active:basketForm.active,position:0,items:basketForm.items
    };
    try {
      if (!Number.isFinite(price) || price < 0) throw new Error("Informe um preço válido.");
      if (basketForm.id) await request(`/api/admin/baskets/${basketForm.id}`,{method:"PATCH",body:JSON.stringify(payload)});
      else await request("/api/admin/baskets",{method:"POST",body:JSON.stringify(payload)});
      setBasketForm({
        id:"",name:"",slug:"",description:"",price:"",image_url:"",category:"traditional",
        supported_households:[],food_tags:[],active:true,items:[]
      });
      setNotice("Cesta salva."); await loadAll();
    } catch(e) { setError(e instanceof Error ? e.message : "Não foi possível salvar a cesta."); }
  }

  function editBasket(basket:Basket) {
    setBasketForm({
      id:basket.id,name:basket.name,slug:basket.slug,description:basket.description || "",image_url:basket.image_url||"",
      price:(basket.price_cents/100).toFixed(2).replace(".",","),active:basket.active,
      category:basket.category || "traditional",
      supported_households:basket.supported_households || [],
      food_tags:basket.food_tags || [],
      items:(basket.basket_items || []).map(item => ({product_id:item.product_id,quantity:item.quantity}))
    });
    setTab("baskets"); window.scrollTo({top:0,behavior:"smooth"});
  }

  async function deleteBasket(basket:Basket) {
    if (!window.confirm(`Excluir a cesta "${basket.name}"?`)) return;
    try { await request(`/api/admin/baskets/${basket.id}`,{method:"DELETE"}); setNotice("Cesta excluída."); await loadAll(); }
    catch(e) { setError(e instanceof Error ? e.message : "Não foi possível excluir."); }
  }

  async function saveHomeContent(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setError("");setNotice("");
    try{const saved=await request<{content:HomeContent}>("/api/admin/home-content",{method:"PUT",body:JSON.stringify(homeContent)});setHomeContent(saved.content);setNotice("Conteúdo da página inicial salvo.");}
    catch(e){setError(e instanceof Error?e.message:"Não foi possível salvar o conteúdo.");}
  }

  async function updateOrder(id:string,status:string) {
    try { await request(`/api/admin/orders/${id}`,{method:"PATCH",body:JSON.stringify({fulfillment_status:status})}); setNotice("Status do pedido atualizado."); await loadAll(); }
    catch(e) { setError(e instanceof Error ? e.message : "Não foi possível atualizar o pedido."); }
  }


  async function saveQuestion(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    let options: {value:string;description:string}[];
    try {
      options = JSON.parse(questionForm.optionsText);
      if (!Array.isArray(options)) throw new Error("As opções precisam estar em formato JSON de lista.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "JSON de opções inválido.");
      return;
    }
    const payload = {
      question_key:questionForm.question_key,
      title:questionForm.title,
      subtitle:questionForm.subtitle,
      options,
      multi:questionForm.multi,
      required:questionForm.required,
      position:Number(questionForm.position),
      active:questionForm.active
    };
    try {
      if (questionForm.id) await request("/api/admin/quiz-questions/" + questionForm.id,{method:"PATCH",body:JSON.stringify(payload)});
      else await request("/api/admin/quiz-questions",{method:"POST",body:JSON.stringify(payload)});
      setQuestionForm({
        id:"",question_key:"",title:"",subtitle:"",
        optionsText:JSON.stringify([{value:"Opção 1",description:"Descrição da opção"},{value:"Opção 2",description:"Descrição da opção"}],null,2),
        multi:false,required:true,position:String(questions.length+1),active:true
      });
      setNotice("Pergunta do quiz salva."); await loadAll();
    } catch(e) { setError(e instanceof Error ? e.message : "Não foi possível salvar a pergunta."); }
  }

  function editQuestion(question:QuizQuestion) {
    setQuestionForm({
      id:question.id,question_key:question.question_key,title:question.title,subtitle:question.subtitle || "",
      optionsText:JSON.stringify(question.options,null,2),multi:question.multi,
      required:question.required,position:String(question.position),active:question.active
    });
    setTab("quiz"); window.scrollTo({top:0,behavior:"smooth"});
  }

  async function deleteQuestion(question:QuizQuestion) {
    if (!window.confirm("Excluir a pergunta " + question.title + "?")) return;
    try { await request("/api/admin/quiz-questions/" + question.id,{method:"DELETE"}); setNotice("Pergunta excluída."); await loadAll(); }
    catch(e) { setError(e instanceof Error ? e.message : "Não foi possível excluir a pergunta."); }
  }

  function toggleBasketMetadata(field:"supported_households"|"food_tags", value:string) {
    setBasketForm(previous => {
      const values = previous[field];
      return {
        ...previous,
        [field]: values.includes(value)
          ? values.filter(item => item !== value)
          : [...values, value],
      };
    });
  }

  function toggleBasketProduct(productId:string) {
    setBasketForm(previous => {
      const found = previous.items.some(item=>item.product_id===productId);
      return {...previous,items:found ? previous.items.filter(item=>item.product_id!==productId) : [...previous.items,{product_id:productId,quantity:1}]};
    });
  }
  function setBasketQuantity(productId:string,quantity:number) {
    setBasketForm(previous=>({...previous,items:previous.items.map(item=>item.product_id===productId?{...item,quantity:Math.max(1,quantity)}:item)}));
  }

  const nav: Array<[typeof tab,string]> = [
    ["overview","Visão geral"],["home","Página inicial"],["products","Produtos"],["baskets","Cestas"],["quiz","Perguntas do quiz"],["orders","Pedidos"]
  ];

  return (
    <div className="admin-content">
      <div className="admin-heading">
        <div><span className="quiz-kicker">Central de operação</span><h1>Gestão da loja</h1><p>Gerencie o catálogo, as cestas e os pedidos em um só lugar.</p></div>
        <button className="secondary-btn" onClick={()=>void loadAll()}>Atualizar dados</button>
      </div>
      <nav className="admin-tabs" aria-label="Seções administrativas">
        {nav.map(([key,label])=><button key={key} className={tab===key?"active":""} onClick={()=>setTab(key)}>{label}</button>)}
      </nav>
      {notice && <div className="admin-notice">{notice}</div>}
      {error && <div className="admin-error" role="alert">{error}</div>}
      {loading ? <div className="empty-state">Carregando dados do painel...</div> : null}

      {!loading && tab==="home" && <form className="site-content-editor" onSubmit={saveHomeContent}>
        <div className="detail-panel"><h2>Editor da página inicial</h2><p>Edite textos, títulos, imagens, botões e destinos dos links. As imagens podem ser enviadas por arquivo (até 8 MB) ou informadas por URL HTTPS. As alterações aparecem na página inicial após salvar.</p></div>
        {homeGroups.map(group=><section className="admin-form site-content-group" key={group.title}><h2>{group.title}</h2><div className="site-content-fields">{group.fields.map(field=>field.image?<ImageField key={field.key} label={field.label} value={homeContent[field.key]} onChange={value=>setHomeContent(previous=>({...previous,[field.key]:value}))}/>:<label key={field.key}>{field.label}{field.multiline?<textarea rows={3} value={homeContent[field.key]} onChange={event=>setHomeContent(previous=>({...previous,[field.key]:event.target.value}))}/>:<input value={homeContent[field.key]} onChange={event=>setHomeContent(previous=>({...previous,[field.key]:event.target.value}))}/>}</label>)}</div></section>)}
        <div className="form-actions"><button className="primary-btn" type="submit">Salvar página inicial</button></div>
      </form>}

      {!loading && tab==="overview" && <>
        <div className="stats-grid">
          <article className="stat-card"><span>Produtos cadastrados</span><strong>{overview.products}</strong></article>
          <article className="stat-card"><span>Cestas cadastradas</span><strong>{overview.baskets}</strong></article>
          <article className="stat-card"><span>Pedidos recebidos</span><strong>{overview.orders}</strong></article>
          <article className="stat-card"><span>Vendas confirmadas</span><strong>{currency(overview.paidRevenueCents)}</strong><small>{overview.paidOrders} pagamentos confirmados</small></article>
        </div>
        <div className="detail-panel"><h2>Operação da loja</h2><p>Catálogo e pedidos salvos no arquivo local do servidor. O frete está configurado como grátis e as cobranças são geradas via Pix pela BravoPay. Estoque é usado apenas internamente e não aparece para os clientes.</p></div>
      </>}

      {!loading && tab==="products" && <div className="admin-columns">
        <form className="admin-form" onSubmit={saveProduct}>
          <h2>{productForm.id?"Editar produto":"Cadastrar produto"}</h2>
          <label>Nome<input required value={productForm.name} onChange={e=>setProductForm({...productForm,name:e.target.value,slug:productForm.id?productForm.slug:toSlug(e.target.value)})}/></label>
          <label>Slug<input required value={productForm.slug} onChange={e=>setProductForm({...productForm,slug:toSlug(e.target.value)})}/></label>
          <label>Descrição<textarea rows={3} value={productForm.description} onChange={e=>setProductForm({...productForm,description:e.target.value})}/></label>
          <div className="form-row"><label>Preço (R$)<input required inputMode="decimal" placeholder="0,00" value={productForm.price} onChange={e=>setProductForm({...productForm,price:e.target.value})}/></label><label>Estoque<input required type="number" min="0" value={productForm.stock} onChange={e=>setProductForm({...productForm,stock:e.target.value})}/></label></div>
          <div className="form-row"><label>Peso (gramas)<input required type="number" min="1" max="100000" value={productForm.weight_grams} onChange={e=>setProductForm({...productForm,weight_grams:e.target.value})}/></label><label>Largura (cm)<input required type="number" min="0.1" max="300" step="0.1" value={productForm.width_cm} onChange={e=>setProductForm({...productForm,width_cm:e.target.value})}/></label></div>\n          <div className="form-row"><label>Altura (cm)<input required type="number" min="0.1" max="300" step="0.1" value={productForm.height_cm} onChange={e=>setProductForm({...productForm,height_cm:e.target.value})}/></label><label>Comprimento (cm)<input required type="number" min="0.1" max="300" step="0.1" value={productForm.length_cm} onChange={e=>setProductForm({...productForm,length_cm:e.target.value})}/></label></div>
          <div className="form-row"><label>SKU<input value={productForm.sku} onChange={e=>setProductForm({...productForm,sku:e.target.value})}/></label></div><ImageField label="Imagem do produto" value={productForm.image_url} onChange={value=>setProductForm({...productForm,image_url:value})}/>
          <label className="inline-check"><input type="checkbox" checked={productForm.active} onChange={e=>setProductForm({...productForm,active:e.target.checked})}/> Produto ativo no catálogo</label>
          <div className="form-actions"><button className="primary-btn" type="submit">Salvar produto</button>{productForm.id&&<button className="secondary-btn" type="button" onClick={()=>setProductForm(emptyProduct)}>Cancelar edição</button>}</div>
        </form>
        <section className="admin-list"><h2>Produtos ({products.length})</h2>
          {products.length===0?<p className="muted-copy">Nenhum produto cadastrado.</p>:products.map(product=><article className="admin-list-item" key={product.id}>
            <div><strong>{product.name}</strong><p>{currency(product.price_cents)} · estoque {product.stock_quantity} · {product.active?"Ativo":"Inativo"}</p></div>
            <div className="item-actions"><button onClick={()=>editProduct(product)}>Editar</button><button className="danger-link" onClick={()=>void deleteProduct(product)}>Excluir</button></div>
          </article>)}
        </section>
      </div>}

      {!loading && tab==="baskets" && <div className="admin-columns">
        <form className="admin-form" onSubmit={saveBasket}>
          <h2>{basketForm.id?"Editar cesta":"Cadastrar cesta"}</h2>
          <label>Nome<input required value={basketForm.name} onChange={e=>setBasketForm({...basketForm,name:e.target.value,slug:basketForm.id?basketForm.slug:toSlug(e.target.value)})}/></label>
          <label>Slug<input required value={basketForm.slug} onChange={e=>setBasketForm({...basketForm,slug:toSlug(e.target.value)})}/></label>
          <label>Descrição<textarea rows={3} value={basketForm.description} onChange={e=>setBasketForm({...basketForm,description:e.target.value})}/></label>
          <label>Preço final (R$)<input required inputMode="decimal" placeholder="0,00" value={basketForm.price} onChange={e=>setBasketForm({...basketForm,price:e.target.value})}/></label>
          <ImageField label="Imagem da cesta" value={basketForm.image_url} onChange={value=>setBasketForm({...basketForm,image_url:value})}/>
          <label>Perfil da cesta
            <select value={basketForm.category} onChange={e=>setBasketForm({...basketForm,category:e.target.value as "economic"|"traditional"|"complete"})}>
              <option value="basic">Básica</option>
              <option value="economic">Econômica</option>
              <option value="traditional">Tradicional</option>
              <option value="complete">Completa</option>
            </select>
          </label>
          <div className="product-picker">
            <strong>Para quantas pessoas?</strong>
            <p className="muted-copy">Marque os tamanhos de família mais adequados. Sem marcação, a cesta não terá restrição por tamanho.</p>
            {["1 pessoa","2 pessoas","3 a 4 pessoas","5 pessoas ou mais"].map(value=>
              <label className="inline-check" key={value}>
                <input type="checkbox" checked={basketForm.supported_households.includes(value)} onChange={()=>toggleBasketMetadata("supported_households",value)}/>
                {value}
              </label>
            )}
          </div>
          <div className="product-picker">
            <strong>Grupos de alimentos atendidos</strong>
            <p className="muted-copy">Essas marcações são usadas para cruzar a cesta com as escolhas do cliente no quiz.</p>
            {["Arroz e feijão","Massas e molhos","Café e açúcar","Óleo e temperos","Biscoitos e complementos"].map(value=>
              <label className="inline-check" key={value}>
                <input type="checkbox" checked={basketForm.food_tags.includes(value)} onChange={()=>toggleBasketMetadata("food_tags",value)}/>
                {value}
              </label>
            )}
          </div>
          <label className="inline-check"><input type="checkbox" checked={basketForm.active} onChange={e=>setBasketForm({...basketForm,active:e.target.checked})}/> Publicar cesta</label>
          <div className="product-picker"><strong>Composição da cesta</strong>{products.length===0?<p className="muted-copy">Cadastre produtos primeiro.</p>:products.map(product=>{
            const selected=basketForm.items.find(item=>item.product_id===product.id);
            return <div className="picker-row" key={product.id}><label className="inline-check"><input type="checkbox" checked={Boolean(selected)} onChange={()=>toggleBasketProduct(product.id)}/><span>{product.name}</span></label>{selected&&<input className="qty-input" type="number" min="1" value={selected.quantity} onChange={e=>setBasketQuantity(product.id,Number(e.target.value))}/>}</div>;
          })}</div>
          <div className="form-actions"><button className="primary-btn" type="submit">Salvar cesta</button>{basketForm.id&&<button className="secondary-btn" type="button" onClick={()=>setBasketForm({
  id:"",name:"",slug:"",description:"",price:"",image_url:"",category:"traditional",
  supported_households:[],food_tags:[],active:true,items:[]
})}>Cancelar edição</button>}</div>
        </form>
        <section className="admin-list"><h2>Cestas ({baskets.length})</h2>
          {baskets.length===0?<p className="muted-copy">Nenhuma cesta cadastrada.</p>:baskets.map(basket=><article className="admin-list-item" key={basket.id}>
            <div><strong>{basket.name}</strong><p>{currency(basket.price_cents)} · {basket.basket_items?.length||0} tipos de produtos · {basket.active?"Publicada":"Oculta"}</p></div>
            <div className="item-actions"><button onClick={()=>editBasket(basket)}>Editar</button><button className="danger-link" onClick={()=>void deleteBasket(basket)}>Excluir</button></div>
          </article>)}
        </section>
      </div>}


      {!loading && tab==="quiz" && <div className="admin-columns">
        <form className="admin-form" onSubmit={saveQuestion}>
          <h2>{questionForm.id?"Editar pergunta":"Nova pergunta do quiz"}</h2>
          <label>Identificador<input required pattern="[a-z0-9_-]+" maxLength={80} placeholder="ex.: household" value={questionForm.question_key} onChange={e=>setQuestionForm({...questionForm,question_key:e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g,"")})}/></label>
          <label>Texto da pergunta<input required maxLength={240} value={questionForm.title} onChange={e=>setQuestionForm({...questionForm,title:e.target.value})}/></label>
          <label>Descrição de apoio<textarea rows={3} maxLength={600} value={questionForm.subtitle} onChange={e=>setQuestionForm({...questionForm,subtitle:e.target.value})}/></label>
          <label>Opções (JSON)<textarea rows={9} spellCheck={false} value={questionForm.optionsText} onChange={e=>setQuestionForm({...questionForm,optionsText:e.target.value})}/></label>
          <p className="muted-copy">Use uma lista JSON com os campos value e description. Mínimo de duas opções.</p>
          <div className="form-row"><label>Ordem<input type="number" min="0" value={questionForm.position} onChange={e=>setQuestionForm({...questionForm,position:e.target.value})}/></label><label className="inline-check"><input type="checkbox" checked={questionForm.multi} onChange={e=>setQuestionForm({...questionForm,multi:e.target.checked})}/> Permitir múltipla escolha</label></div>
          <label className="inline-check"><input type="checkbox" checked={questionForm.required} onChange={e=>setQuestionForm({...questionForm,required:e.target.checked})}/> Resposta obrigatória</label>
          <label className="inline-check"><input type="checkbox" checked={questionForm.active} onChange={e=>setQuestionForm({...questionForm,active:e.target.checked})}/> Pergunta ativa no quiz</label>
          <div className="form-actions"><button className="primary-btn" type="submit">Salvar pergunta</button>{questionForm.id&&<button className="secondary-btn" type="button" onClick={()=>setQuestionForm({id:"",question_key:"",title:"",subtitle:"",optionsText:JSON.stringify([{value:"Opção 1",description:"Descrição da opção"},{value:"Opção 2",description:"Descrição da opção"}],null,2),multi:false,required:true,position:String(questions.length+1),active:true})}>Cancelar</button>}</div>
        </form>
        <section className="admin-list"><h2>Perguntas cadastradas ({questions.length})</h2>
          {questions.length===0?<p className="muted-copy">Nenhuma pergunta salva. Execute o schema SQL atualizado para inserir as perguntas iniciais.</p>:questions.map(question=><article className="admin-list-item" key={question.id}>
            <div><strong>{question.position}. {question.title}</strong><p>{question.question_key} · {question.options?.length||0} opções · {question.multi?"Múltipla escolha":"Escolha única"} · {question.active?"Ativa":"Inativa"}</p></div>
            <div className="item-actions"><button onClick={()=>editQuestion(question)}>Editar</button><button className="danger-link" onClick={()=>void deleteQuestion(question)}>Excluir</button></div>
          </article>)}
        </section>
      </div>}

      {!loading && tab==="orders" && <section className="admin-list orders-list">
        <h2>Últimos pedidos</h2>
        {orders.length===0?<p className="muted-copy">Nenhum pedido recebido ainda. Os pedidos gerados pelo checkout Pix aparecerão aqui.</p>:orders.map(order=><article className="admin-list-item order-item" key={order.id}>
          <div><strong>Pedido #{order.order_number}</strong><p>{order.customer_name} · {order.customer_phone} · CEP {order.cep}</p><p>{[order.address?.logradouro,order.address?.number,order.address?.complement,order.address?.bairro,[order.address?.localidade,order.address?.uf].filter(Boolean).join("/")].filter(Boolean).join(" · ")}</p><p>{currency(order.total_cents)} · pagamento: {order.payment_status} · {new Date(order.created_at).toLocaleString("pt-BR")}</p><p>Entrega: {order.shipping_service || "Frete grátis"}</p>{order.order_items?.map((item,index)=><p key={index}>{item.quantity} × {item.product_name} · {currency(item.line_total_cents)}</p>)}</div>
          <label className="order-status">Entrega<select value={order.fulfillment_status} onChange={e=>void updateOrder(order.id,e.target.value)}><option value="pending">Pendente</option><option value="processing">Em separação</option><option value="shipped">Enviado</option><option value="delivered">Entregue</option><option value="cancelled">Cancelado</option></select></label>
        </article>)}
      </section>}
    </div>
  );
}
