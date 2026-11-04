import Link from "next/link";
import Image from "next/image";
import { signInAdmin } from "./actions";

const messages: Record<string, string> = {
  "preencha-os-campos": "Informe e-mail e senha.",
  "supabase-nao-configurado": "O Supabase ainda não foi configurado neste projeto.",
  "credenciais-invalidas": "E-mail ou senha inválidos.",
  "nao-foi-possivel-validar": "Não foi possível validar sua sessão. Tente novamente.",
  "usuario-sem-permissao": "O usuário autenticado ainda não foi autorizado como administrador."
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const message = params.error ? messages[params.error] || "Não foi possível entrar." : "";

  return (
    <main className="quiz-wrap">
      <section className="quiz-card">
        <Link href="/" className="forti-brand"><Image src="/images/logo.svg" alt="" width={38} height={38}/><span><strong>FortiCestas</strong><small>Cestas básicas para sua família</small></span></Link>
        <div className="mt-8">
          <span className="quiz-kicker">Acesso restrito</span>
          <h1>Entrar no painel</h1>
          <p className="quiz-sub">Área exclusiva para usuários cadastrados e autorizados pela administração.</p>
        </div>
        <form action={signInAdmin} className="grid gap-4">
          <label className="grid gap-2 text-sm font-bold">E-mail
            <input className="text-input" type="email" name="email" autoComplete="username" required />
          </label>
          <label className="grid gap-2 text-sm font-bold">Senha
            <input className="text-input" type="password" name="password" autoComplete="current-password" required />
          </label>
          {message && <p role="alert" className="error-text">{message}</p>}
          <button type="submit" className="primary-btn w-full">Entrar no painel</button>
        </form>
        <p className="text-xs text-gray-400 mt-6">Acesso protegido por Supabase Auth e lista de administradores.</p>
      </section>
    </main>
  );
}
