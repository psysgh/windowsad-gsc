import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ground Station Compromise — FIAP GS / Offensive Security",
  description: "Simulação educacional de exploração AD em ambiente de estação terrestre de satélites"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  );
}
