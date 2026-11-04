import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAdminContext } from "@/lib/admin-auth";
import { signOutAdmin } from "./login/actions";
import AdminDashboard from "@/components/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const context = await getAdminContext();
  if (!context.ok) {
    if (context.status === 401) redirect("/admin/login");
    return (
      <main className="quiz-wrap"><section className="quiz-card">
        <Link href="/" className="forti-brand"><Image src="/images/logo.svg" alt="" width={38} height={38}/><span><strong>FortiCestas</strong><small>Cestas básicas para sua família</small></span></Link>
        <h1 className="mt-8">Configuração do painel pendente</h1>
        <p className="quiz-sub">{context.message}</p>
        <p className="text-sm text-gray-500">Configure o Supabase e autorize seu usuário na tabela admin_users, conforme o README.</p>
      </section></main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <Link href="/" className="brand"><span className="brand-mark">F</span> FortiCestas</Link>
        <div className="admin-user">
          <span>{context.user.email}</span>
          <form action={signOutAdmin}><button className="secondary-btn" type="submit">Sair</button></form>
        </div>
      </header>
      <AdminDashboard />
    </main>
  );
}
