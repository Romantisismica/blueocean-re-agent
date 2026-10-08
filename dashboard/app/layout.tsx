import type { ReactNode } from "react";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import GlassBackground from "../components/GlassBackground";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata = {
  title: "BlueOcean RE · Dashboard",
  description:
    "Océanos Azules inmobiliarios en Sabaneta y Envigado, en tiempo real.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${outfit.variable} ${jetbrains.variable}`}>
      <body className="min-h-[100dvh] antialiased">
        <GlassBackground />
        {children}
      </body>
    </html>
  );
}
