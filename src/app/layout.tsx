import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FortiCestas | Cestas básicas para sua família",
  description: "Conheça quatro opções de cestas básicas, confira os itens de cada composição e encontre a melhor escolha para sua casa.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
