import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "@/components/layout/AppShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Tekoá-Hur — Control de Asistencias",
  description:
    "Sistema de control de asistencias académicas para alumnos y docentes mediante QR",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        {/*
         * AppShell envuelve TODA la app:
         * - Header con logo (visible en todas las pantallas)
         * - Breadcrumb automático (invisible solo en "/")
         * - Footer institucional
         *
         * EXCEPCIÓN: Si la ruta /login no debe mostrar el header/shell,
         * crear src/app/login/layout.js que devuelva {children} directamente.
         */}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
