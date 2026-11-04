-- FortiCestas starter catalogue. Run AFTER supabase/schema.sql.
-- Prices are launch suggestions, not supplier quotations. Confirm actual purchase cost, packaging and margin before selling.
-- Stock starts at zero intentionally: enter the real quantity of assembled baskets in Admin > Produtos.
-- Package weight and dimensions are provisional estimates; measure the packed basket before activating live freight quotes.

begin;

insert into public.products
 (name,slug,description,sku,price_cents,stock_quantity,image_url,active,weight_grams,width_cm,height_cm,length_cm)
values
 ('Pacote Cesta Básica FortiCestas','produto-cesta-basica','Unidade pronta da Cesta Básica FortiCestas.','FORTI-BASICA',8990,0,'/images/baskets/basica.svg',true,8000,40,25,30),
 ('Pacote Cesta Econômica FortiCestas','produto-cesta-economica','Unidade pronta da Cesta Econômica FortiCestas.','FORTI-ECONOMICA',15990,0,'/images/baskets/economica.svg',true,13500,42,28,34),
 ('Pacote Cesta Tradicional FortiCestas','produto-cesta-tradicional','Unidade pronta da Cesta Tradicional FortiCestas.','FORTI-TRADICIONAL',23990,0,'/images/baskets/tradicional.svg',true,18500,45,30,36),
 ('Pacote Cesta Completa FortiCestas','produto-cesta-completa','Unidade pronta da Cesta Completa FortiCestas.','FORTI-COMPLETA',34990,0,'/images/baskets/completa.svg',true,26500,50,35,40)
on conflict(slug) do update set
 name=excluded.name,description=excluded.description,sku=excluded.sku,price_cents=excluded.price_cents,
 image_url=excluded.image_url,active=excluded.active,weight_grams=excluded.weight_grams,
 width_cm=excluded.width_cm,height_cm=excluded.height_cm,length_cm=excluded.length_cm,updated_at=now();

insert into public.baskets
 (name,slug,description,price_cents,active,position,category,supported_households,food_tags,image_url)
values
 ('Cesta Básica','cesta-basica','O essencial para reforçar a despensa com os alimentos mais usados no dia a dia.',8990,true,1,'basic',array['1 pessoa','2 pessoas'],array['Arroz e feijão','Massas e molhos','Óleo e temperos'],'/images/baskets/basica.svg'),
 ('Cesta Econômica','cesta-economica','Mais unidades dos itens de maior giro, com uma seleção equilibrada para economizar.',15990,true,2,'economic',array['1 pessoa','2 pessoas','3 a 4 pessoas'],array['Arroz e feijão','Massas e molhos','Café e açúcar','Óleo e temperos','Biscoitos e complementos'],'/images/baskets/economica.svg'),
 ('Cesta Tradicional','cesta-tradicional','Uma compra mais reforçada, com variedade de mercearia para a rotina da família.',23990,true,3,'traditional',array['2 pessoas','3 a 4 pessoas','5 pessoas ou mais'],array['Arroz e feijão','Massas e molhos','Café e açúcar','Óleo e temperos','Biscoitos e complementos'],'/images/baskets/tradicional.svg'),
 ('Cesta Completa','cesta-completa','Nossa seleção mais robusta, com mais itens e quantidades para uma despensa bem abastecida.',34990,true,4,'complete',array['3 a 4 pessoas','5 pessoas ou mais'],array['Arroz e feijão','Massas e molhos','Café e açúcar','Óleo e temperos','Biscoitos e complementos'],'/images/baskets/completa.svg')
on conflict(slug) do update set
 name=excluded.name,description=excluded.description,price_cents=excluded.price_cents,active=excluded.active,
 position=excluded.position,category=excluded.category,supported_households=excluded.supported_households,
 food_tags=excluded.food_tags,image_url=excluded.image_url,updated_at=now();

delete from public.basket_items
where basket_id in(select id from public.baskets where slug in('cesta-basica','cesta-economica','cesta-tradicional','cesta-completa'));

insert into public.basket_items(basket_id,product_id,quantity)
select b.id,p.id,1 from(values
 ('cesta-basica','produto-cesta-basica'),
 ('cesta-economica','produto-cesta-economica'),
 ('cesta-tradicional','produto-cesta-tradicional'),
 ('cesta-completa','produto-cesta-completa')
) as rows(basket_slug,product_slug)
join public.baskets b on b.slug=rows.basket_slug
join public.products p on p.slug=rows.product_slug;

commit;
