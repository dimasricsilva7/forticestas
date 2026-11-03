import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FortiCestas | Cestas básicas para sua casa",
  description: "Monte sua cesta básica de acordo com a necessidade da sua família. Consulte opções e entrega pelo CEP.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
