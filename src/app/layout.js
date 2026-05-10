import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "@/components/layout/AppShell";
import { AuthProvider } from "@/context/AuthContext"; // ✅ NUEVO
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Tekoá-Hur — Control de Asistencias",
  description: "Sistema de control de asistencias académicas para alumnos y docentes mediante QR",
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico", apple: "/logo.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
        {/*
         * AuthProvider: provee usuario, token, login() y logout() a toda la app.
         * AppShell: header con logo, breadcrumb y footer.
         * El login de /login tiene su propio layout (sin AppShell).
         */}
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
