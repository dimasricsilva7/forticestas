"use client";

import { useCallback, useEffect, useState } from "react";

type Product = {
  id: string; name: string; slug: string; description: string; sku: string | null;
  price_cents: number; stock_quantity: number; image_url: string | null; active: boolean;
};
type BasketItem = { product_id: string; quantity: number };
type Basket = {
  id: string; name: string; slug: string; description: string; price_cents: number;
  active: boolean; position: number; basket_items: BasketItem[];
};
type Order = {
  id: string; order_number: number; customer_name: string; customer_phone: string;
  cep: string; total_cents: number; payment_status: string; fulfillment_status: string; created_at: string;
};
type ProductForm = {
  id?: string; name: string; slug: string; description: string; sku: string;
  price: string; stock: string; image_url: string; active: boolean;
};
type QuizQuestion = {
  id: string; question_key: string; title: string; subtitle: string;
  options: { value: string; description: string }[]; multi: boolean;
  required: boolean; position: number; active: boolean;
};

const emptyProduct: ProductForm = {
  name:"", slug:"", description:"", sku:"", price:"", stock:"0", image_url:"", active:true
};

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
  const [tab,setTab] = useState<"overview"|"products"|"baskets"|"quiz"|"orders">("overview");
  const [products,setProducts] = useState<Product[]>([]);
  const [questions,setQuestions] = useState<QuizQuestion[]>([]);
  const [baskets,setBaskets] = useState<Basket[]>([]);
  const [orders,setOrders] = useState<Order[]>([]);
  const [overview,setOverview] = useState({products:0,baskets:0,orders:0,paidRevenueCents:0,paidOrders:0});
  const [loading,setLoading] = useState(true);
  const [notice,setNotice] = useState("");
  const [error,setError] = useState("");
  const [productForm,setProductForm] = useState<ProductForm>(emptyProduct);
  const [basketForm,setBasketForm] = useState({id:"",name:"",slug:"",description:"",price:"",active:true,items:[] as {product_id:string;quantity:number}[]});
  const [questionForm,setQuestionForm] = useState({
    id:"", question_key:"", title:"", subtitle:"",
    optionsText: JSON.stringify([{value:"Opção 1",description:"Descrição da opção"},{value:"Opção 2",description:"Descrição da opção"}],null,2),
    multi:false, required:true, position:"1", active:true
  });

  const loadAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [o,p,b,r,q] = await Promise.all([
        request<typeof overview>("/api/admin/overview"),
        request<{products:Product[]}>("/api/admin/products"),
        request<{baskets:Basket[]}>("/api/admin/baskets"),
        request<{orders:Order[]}>("/api/admin/orders"),
        request<{questions:QuizQuestion[]}>("/api/admin/quiz-questions"),
      ]);
      setOverview(o); setProducts(p.products); setBaskets(b.baskets); setOrders(r.orders); setQuestions(q.questions);
    } catch (e) { setError(e instanceof Error ? e.message : "Erro ao carregar o painel."); }
    finally { setLoading(false); }
  },[]);

  useEffect(() => { void loadAll(); },[loadAll]);

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    const price = Number(productForm.price.replace(",","."));
    const payload = {
      name:productForm.name, slug:productForm.slug || toSlug(productForm.name),
      description:productForm.description, sku:productForm.sku || null,
      price_cents:Math.round(price*100), stock_quantity:Number(productForm.stock),
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
      stock:String(product.stock_quantity),image_url:product.image_url || "",active:product.active
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
      description:basketForm.description,price_cents:Math.round(price*100),
      active:basketForm.active,position:0,items:basketForm.items
    };
    try {
      if (!Number.isFinite(price) || price < 0) throw new Error("Informe um preço válido.");
      if (basketForm.id) await request(`/api/admin/baskets/${basketForm.id}`,{method:"PATCH",body:JSON.stringify(payload)});
      else await request("/api/admin/baskets",{method:"POST",body:JSON.stringify(payload)});
      setBasketForm({id:"",name:"",slug:"",description:"",price:"",active:true,items:[]});
      setNotice("Cesta salva."); await loadAll();
    } catch(e) { setError(e instanceof Error ? e.message : "Não foi possível salvar a cesta."); }
  }

  function editBasket(basket:Basket) {
    setBasketForm({
      id:basket.id,name:basket.name,slug:basket.slug,description:basket.description || "",
      price:(basket.price_cents/100).toFixed(2).replace(".",","),active:basket.active,
      items:(basket.basket_items || []).map(item => ({product_id:item.product_id,quantity:item.quantity}))
    });
    setTab("baskets"); window.scrollTo({top:0,behavior:"smooth"});
  }

  async function deleteBasket(basket:Basket) {
    if (!window.confirm(`Excluir a cesta "${basket.name}"?`)) return;
    try { await request(`/api/admin/baskets/${basket.id}`,{method:"DELETE"}); setNotice("Cesta excluída."); await loadAll(); }
    catch(e) { setError(e instanceof Error ? e.message : "Não foi possível excluir."); }
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
    ["overview","Visão geral"],["products","Produtos"],["baskets","Cestas"],["quiz","Perguntas do quiz"],["orders","Pedidos"]
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

      {!loading && tab==="overview" && <>
        <div className="stats-grid">
          <article className="stat-card"><span>Produtos cadastrados</span><strong>{overview.products}</strong></article>
          <article className="stat-card"><span>Cestas cadastradas</span><strong>{overview.baskets}</strong></article>
          <article className="stat-card"><span>Pedidos recebidos</span><strong>{overview.orders}</strong></article>
          <article className="stat-card"><span>Vendas confirmadas</span><strong>{currency(overview.paidRevenueCents)}</strong><small>{overview.paidOrders} pagamentos confirmados</small></article>
        </div>
        <div className="detail-panel"><h2>Próximas configurações</h2><p>Cadastre produtos e monte suas cestas. Para receber pagamentos, configure o webhook do BravoPay e o provedor de frete. Nenhum pedido será marcado como pago sem confirmação autenticada.</p></div>
      </>}

      {!loading && tab==="products" && <div className="admin-columns">
        <form className="admin-form" onSubmit={saveProduct}>
          <h2>{productForm.id?"Editar produto":"Cadastrar produto"}</h2>
          <label>Nome<input required value={productForm.name} onChange={e=>setProductForm({...productForm,name:e.target.value,slug:productForm.id?productForm.slug:toSlug(e.target.value)})}/></label>
          <label>Slug<input required value={productForm.slug} onChange={e=>setProductForm({...productForm,slug:toSlug(e.target.value)})}/></label>
          <label>Descrição<textarea rows={3} value={productForm.description} onChange={e=>setProductForm({...productForm,description:e.target.value})}/></label>
          <div className="form-row"><label>Preço (R$)<input required inputMode="decimal" placeholder="0,00" value={productForm.price} onChange={e=>setProductForm({...productForm,price:e.target.value})}/></label><label>Estoque<input required type="number" min="0" value={productForm.stock} onChange={e=>setProductForm({...productForm,stock:e.target.value})}/></label></div>
          <div className="form-row"><label>SKU<input value={productForm.sku} onChange={e=>setProductForm({...productForm,sku:e.target.value})}/></label><label>URL da imagem<input type="url" value={productForm.image_url} onChange={e=>setProductForm({...productForm,image_url:e.target.value})}/></label></div>
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
          <label className="inline-check"><input type="checkbox" checked={basketForm.active} onChange={e=>setBasketForm({...basketForm,active:e.target.checked})}/> Publicar cesta</label>
          <div className="product-picker"><strong>Composição da cesta</strong>{products.length===0?<p className="muted-copy">Cadastre produtos primeiro.</p>:products.map(product=>{
            const selected=basketForm.items.find(item=>item.product_id===product.id);
            return <div className="picker-row" key={product.id}><label className="inline-check"><input type="checkbox" checked={Boolean(selected)} onChange={()=>toggleBasketProduct(product.id)}/><span>{product.name}</span></label>{selected&&<input className="qty-input" type="number" min="1" value={selected.quantity} onChange={e=>setBasketQuantity(product.id,Number(e.target.value))}/>}</div>;
          })}</div>
          <div className="form-actions"><button className="primary-btn" type="submit">Salvar cesta</button>{basketForm.id&&<button className="secondary-btn" type="button" onClick={()=>setBasketForm({id:"",name:"",slug:"",description:"",price:"",active:true,items:[]})}>Cancelar edição</button>}</div>
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
        {orders.length===0?<p className="muted-copy">Nenhum pedido recebido. O checkout será habilitado após configurar pagamento e frete.</p>:orders.map(order=><article className="admin-list-item order-item" key={order.id}>
          <div><strong>Pedido #{order.order_number}</strong><p>{order.customer_name} · {order.customer_phone} · CEP {order.cep}</p><p>{currency(order.total_cents)} · pagamento: {order.payment_status} · {new Date(order.created_at).toLocaleString("pt-BR")}</p></div>
          <label className="order-status">Entrega<select value={order.fulfillment_status} onChange={e=>void updateOrder(order.id,e.target.value)}><option value="pending">Pendente</option><option value="processing">Em separação</option><option value="shipped">Enviado</option><option value="delivered">Entregue</option><option value="cancelled">Cancelado</option></select></label>
        </article>)}
      </section>}
    </div>
  );
}
