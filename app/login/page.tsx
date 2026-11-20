
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  UtensilsCrossed,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { setTokens, getCurrentUserRole } from "@/lib/auth"

type LoginResponse = {
  accessToken?: string
  access_token?: string
  refreshToken?: string
  refresh_token?: string
}

type LoginMode = "admin" | "customer"

export default function LoginPage() {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loginMode, setLoginMode] = useState<LoginMode>("customer")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const data = await apiClient<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      })

      const accessToken = data.accessToken || data.access_token
      const refreshToken = data.refreshToken || data.refresh_token

      if (!accessToken) {
        throw new Error("No access token received from the server.")
      }

      setTokens(accessToken, refreshToken)

      const role = getCurrentUserRole()

      if (!role) {
        throw new Error("Unable to verify your account role. Please contact the administrator.")
      }

      if (loginMode === "admin" && role !== "admin") {
        throw new Error("Access denied. Only authorized admin accounts can log in as Admin.")
      }

      if (loginMode === "admin") {
        router.replace("/food-management")
      } else {
        router.replace("/dashboard")
      }

      router.refresh()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to log in."

      setError(message)

      if (
        message.includes("Access denied") ||
        message.includes("Unable to verify")
      ) {
        const { clearTokens } = await import("@/lib/auth")
        clearTokens()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f8f4ec] lg:grid-cols-2">
      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">

          <Link href="/" className="mb-12 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-[#493326] text-[#fffaf1]">
              <UtensilsCrossed className="size-5" />
            </div>
            <div>
              <h1 className="font-bold tracking-widest text-[#493326]">
                CONSTANTINO
              </h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#9b7958]">
                Food House
              </p>
            </div>
          </Link>

          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#a4774e]">
            Welcome Back
          </p>

          <h2 className="mt-4 font-serif text-5xl text-[#493326]">
            Sign in
          </h2>

          <p className="mt-4 text-sm leading-7 text-[#887565]">
            Choose how you want to access Constantino Food House.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-6">

            <div>
              <label className="mb-3 block text-sm font-semibold text-[#493326]">
                Login As
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("customer")
                    setError("")
                  }}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                    loginMode === "customer"
                      ? "border-[#795638] bg-[#eee4d6] text-[#493326] ring-2 ring-[#795638]/20"
                      : "border-[#ddcdbb] bg-[#fffdf8] text-[#887565]"
                  }`}
                >
                  <ShoppingBag className="size-6" />
                  <span className="text-sm font-bold">Customer</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("admin")
                    setError("")
                  }}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                    loginMode === "admin"
                      ? "border-[#795638] bg-[#eee4d6] text-[#493326] ring-2 ring-[#795638]/20"
                      : "border-[#ddcdbb] bg-[#fffdf8] text-[#887565]"
                  }`}
                >
                  <ShieldCheck className="size-6" />
                  <span className="text-sm font-bold">Admin</span>
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#493326]">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                className="h-13 w-full rounded-xl border border-[#ddcdbb] bg-[#fffdf8] px-4 text-sm text-[#493326] outline-none transition focus:border-[#795638] focus:ring-2 focus:ring-[#795638]/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#493326]">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-13 w-full rounded-xl border border-[#ddcdbb] bg-[#fffdf8] px-4 pr-12 text-sm text-[#493326] outline-none transition focus:border-[#795638] focus:ring-2 focus:ring-[#795638]/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#927b66]"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-13 w-full items-center justify-center rounded-full bg-[#493326] font-semibold text-white transition hover:bg-[#634832] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#887565]">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-[#795638] hover:underline"
            >
              Create a customer account
            </Link>
          </p>

          <Link
            href="/"
            className="mt-8 block text-center text-xs text-[#9b8876] hover:text-[#493326]"
          >
            ← Back to Home
          </Link>
        </div>
      </section>

      <section className="relative hidden min-h-screen overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1400&q=90"
          alt="Freshly prepared delicious food"
          className="absolute inset-0 size-full object-cover"
        />

        <div className="absolute inset-0 bg-[#38271e]/55" />

        <div className="absolute bottom-16 left-14 right-14 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#e6c9a6]">
            A Taste Worth Remembering
          </p>
          <h2 className="mt-5 max-w-lg font-serif text-5xl leading-tight">
            Good food brings people together.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/80">
            Enjoy comforting favorites and delicious meals,
            thoughtfully prepared for every moment.
          </p>
        </div>
      </section>
    </main>
  )
}
