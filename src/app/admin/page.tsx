import Link from "next/link";

const modules = [
  ["Visão geral", "Acompanhe vendas, pedidos e indicadores."],
  ["Produtos e cestas", "Cadastre produtos, preços, estoque e composição das cestas."],
  ["Perguntas do quiz", "Edite perguntas, opções e a lógica de recomendação."],
  ["Pedidos", "Consulte pedidos, dados de entrega e status de pagamento."],
  ["Frete e pagamentos", "Configure integrações e acompanhe transações."]
];

export default function AdminPage() {
  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="brand"><span className="brand-mark">F</span> FortiCestas</Link>
        <div className="mt-10">
          <span className="quiz-kicker">Painel administrativo</span>
          <h1 className="text-4xl font-black tracking-tight mt-3">Central de gestão</h1>
          <p className="text-gray-500 mt-2">Estrutura inicial dos módulos administrativos.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          {modules.map(([title,description]) => <article key={title} className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-extrabold text-lg">{title}</h2><p className="text-sm text-gray-500 mt-2 leading-relaxed">{description}</p>
            <span className="text-xs text-amber-700 font-bold mt-5 inline-block">Configuração pendente</span>
          </article>)}
        </div>
        <p className="text-xs text-gray-400 mt-10">Acesso de demonstração sem autenticação. Não utilizar em produção até configurar Supabase Auth e políticas de acesso.</p>
      </div>
    </main>
  );
}
