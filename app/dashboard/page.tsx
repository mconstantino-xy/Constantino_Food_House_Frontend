
"use client"

import { useRouter } from "next/navigation"
import {
  LogOut,
  UtensilsCrossed,
  ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { clearTokens } from "@/lib/auth"
import { useAuthGuard } from "@/hooks/useAuthGuard"

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    Pending: "bg-yellow-100 text-yellow-800",
    Preparing: "bg-blue-100 text-blue-800",
    "Out for Delivery": "bg-orange-100 text-orange-800",
    Delivered: "bg-green-100 text-green-800",
    Completed: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
  };

  return colors[status] || "bg-gray-100 text-gray-700";
};

export default function DashboardPage() {
  const router = useRouter()
  const { isChecking } = useAuthGuard(true)

  function handleLogout() {
    clearTokens()
    router.replace("/login")
    router.refresh()
  }

  if (isChecking) {
    return (
      <main className="min-h-screen bg-[#f8f4ec]" />
    )
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] text-[#39291f]">

      <header className="flex items-center justify-between border-b border-[#e9dfd0] bg-[#faf8f2] px-6 py-5">

        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-[#493326] text-white">
            <UtensilsCrossed className="size-5" />
          </div>

          <div>
            <h1 className="font-bold tracking-wide text-[#493326]">
              CONSTANTINO
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#9b7958]">
              Food House
            </p>
          </div>
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="rounded-full border-[#d9c7b1] text-[#493326] hover:bg-[#eee4d6]"
        >
          <LogOut className="mr-2 size-4" />
          Logout
        </Button>

      </header>

      <section className="mx-auto max-w-5xl px-6 py-16">

        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a4774e]">
          Customer Dashboard
        </p>

        <h2 className="mt-4 font-serif text-4xl text-[#493326]">
          Welcome to Constantino Food House!
        </h2>

        <p className="mt-4 max-w-xl leading-7 text-[#887565]">
          Discover delicious meals and refreshing drinks.
          Your favorite food is just a few clicks away.
        </p>

        <div className="mt-10 rounded-3xl border border-[#e9dfd0] bg-[#fffdf8] p-8 shadow-sm">

          <ShoppingBag className="size-9 text-[#a4774e]" />

          <h3 className="mt-5 font-serif text-2xl text-[#493326]">
            Ready to order?
          </h3>

          <p className="mt-2 text-sm text-[#887565]">
            Explore our menu and choose your favorite meals.
          </p>

          <Button
            onClick={() => router.push("/")}
            className="mt-6 rounded-full bg-[#493326] px-6 text-white hover:bg-[#634832]"
          >
            View Menu
          </Button>

        </div>
      </section>
    </main>
  )
}
