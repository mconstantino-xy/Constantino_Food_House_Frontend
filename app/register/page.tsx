
"use client"

import { useState } from "react"
import Link from "next/link"
import {
  UtensilsCrossed,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { apiClient } from "@/lib/api"

export default function RegisterPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    try {
      await apiClient("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
        }),
      })

      setSuccess("Your account has been created successfully!")
      setUsername("")
      setPassword("")
      setConfirmPassword("")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f8f4ec] lg:grid-cols-2">

      {/* LEFT SIDE - FOOD IMAGE AND WELCOME TEXT */}
      <section className="relative hidden min-h-screen overflow-hidden lg:block">

        <img
          src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1400&q=90"
          alt="Freshly prepared delicious food"
          className="absolute inset-0 size-full object-cover"
        />

        <div className="absolute inset-0 bg-[#38271e]/55" />

        <div className="absolute left-14 right-14 top-16 text-white">

          <div className="mb-12 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
              <UtensilsCrossed className="size-5" />
            </div>

            <div>
              <h1 className="font-bold tracking-widest">
                CONSTANTINO
              </h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#e6c9a6]">
                Food House
              </p>
            </div>
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#e6c9a6]">
            WELCOME TO CONSTANTINO
          </p>

          <h2 className="mt-6 max-w-lg font-serif text-5xl leading-tight">
            Your next favorite meal starts here.
          </h2>

          <p className="mt-5 max-w-md text-sm leading-7 text-white/85">
            Create your account and discover delicious food
            and comforting favorites, thoughtfully prepared
            for every moment.
          </p>

          <div className="mt-8 h-px w-20 bg-[#e6c9a6]" />

          <p className="mt-5 text-xs tracking-widest text-white/70">
            GOOD FOOD. GOOD MOMENTS.
          </p>
        </div>
      </section>

      {/* RIGHT SIDE - REGISTER FORM */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-12">

        <div className="w-full max-w-md">

          <Link href="/" className="mb-10 flex items-center gap-3 lg:hidden">
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
            Join Our Food Family
          </p>

          <h2 className="mt-4 font-serif text-5xl text-[#493326]">
            Create Account
          </h2>

          <p className="mt-4 text-sm leading-7 text-[#887565]">
            Sign up today and get ready to enjoy your favorite
            meals from Constantino Food House.
          </p>

          <form onSubmit={handleRegister} className="mt-8 space-y-5">

            {/* USERNAME */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#493326]">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                className="h-13 w-full rounded-xl border border-[#ddcdbb] bg-[#fffdf8] px-4 text-sm text-[#493326] outline-none transition focus:border-[#795638] focus:ring-2 focus:ring-[#795638]/10"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#493326]">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
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

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#493326]">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="h-13 w-full rounded-xl border border-[#ddcdbb] bg-[#fffdf8] px-4 pr-12 text-sm text-[#493326] outline-none transition focus:border-[#795638] focus:ring-2 focus:ring-[#795638]/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#927b66]"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            {/* SUCCESS MESSAGE */}
            {success && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="size-5" />
                  Account Created!
                </div>

                <p className="mt-2">{success}</p>

                <Link
                  href="/login"
                  className="mt-3 inline-block font-bold underline"
                >
                  Continue to Login
                </Link>
              </div>
            )}

            {/* REGISTER BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-13 w-full items-center justify-center rounded-full bg-[#493326] font-semibold text-white transition hover:bg-[#634832] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </button>

          </form>

          <p className="mt-7 text-center text-sm text-[#887565]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-[#795638] hover:underline"
            >
              Sign In
            </Link>
          </p>

          <Link
            href="/"
            className="mt-7 block text-center text-xs text-[#9b8876] hover:text-[#493326]"
          >
            ← Back to Home
          </Link>

        </div>
      </section>
    </main>
  )
}
