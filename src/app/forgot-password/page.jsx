"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword } = useAuth();

  const [mail, setMail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
  e.preventDefault();

  setError("");
  setLoading(true);

  const res = await forgotPassword(mail);

  if (!res.ok) {
    setError(res.message);
  } else {
    alert(res.message);
    setMail("");
  }

  setLoading(false);
}

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="mb-6 text-center text-xl font-bold text-gray-800">
            Recuperar Contraseña
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="mail"
                className="mb-1 block text-sm font-medium text-gray-700 text-center"
              >
                Ingresá tu email registrado.
              </label>

              <input
                type="email"
                id="mail"
                name="mail"
                autoComplete="email"
                value={mail}
                onChange={(e) => setMail(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">
                {error}
              </p>
            )}

            {message && (
              <p className="text-sm text-green-600 text-center">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar Mail"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}