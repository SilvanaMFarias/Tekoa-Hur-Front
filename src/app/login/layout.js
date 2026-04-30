/**
 * Layout específico para la pantalla de login.
 * No usa AppShell para evitar mostrar el header/breadcrumb/footer
 * en la pantalla de autenticación.
 */
export default function LoginLayout({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      {children}
    </div>
  );
}
