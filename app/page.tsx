
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  UtensilsCrossed,
  ArrowRight,
  ShoppingBag,
  Loader2,
  Plus,
  Minus,
  Trash2,
  Coffee,
  Clock,
  Star,
  LogOut,
  MapPin,
  CreditCard,
  CheckCircle2,
  ClipboardList,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/api"
import {
  clearTokens,
  isAuthenticated,
  getCurrentUserId,
} from "@/lib/auth"

type FoodItem = {
  food_item_id: number
  food_name: string
  description: string
  price: number
  category_name: string
  availability: string
}

type CartItem = FoodItem & {
  quantity: number
}

type OrderResponse = {
  order_id: number
  message?: string
}

const CATEGORY_ORDER = [
  "Rice Meals",
  "Beverages",
  "Snacks",
  "Burgers",
]


function getFoodImage(foodName: string) {
  const name = foodName.toLowerCase().trim()

  // RICE MEALS
  if (name.includes("chicken inasal")) {
    return "/images/chicken-inasal.jpg"
  }

  if (name.includes("chicken") && name.includes("rice")) {
    return "/images/chicken-rice.jpg"
  }

  if (name.includes("pork") && name.includes("silog")) {
    return "/images/pork-silog.jpg"
  }

  if (name.includes("beef tapa")) {
    return "/images/beef-tapa.jpg"
  }

  if (name.includes("tapa")) {
    return "/images/beef-tapa.jpg"
  }

  // DRINKS
  if (name.includes("iced tea")) {
    return "/images/iced-tea.jpg"
  }

  if (name.includes("lemonade")) {
    return "/images/lemonade.jpg"
  }

  if (name.includes("mango shake")) {
    return "/images/mango-shake.jpg"
  }

  if (name.includes("water")) {
    return "/images/bottled-water.jpg"
  }

  // SNACKS
  if (name.includes("fries")) {
    return "/images/fries.jpg"
  }

  if (name.includes("nuggets")) {
    return "/images/chicken-nuggets.jpg"
  }

  if (name.includes("nachos")) {
    return "/images/nachos.jpg"
  }

  // BURGERS
  if (name.includes("bacon")) {
    return "/images/bacon-cheese-burger.jpg"
  }

  if (name.includes("chicken burger")) {
    return "/images/chicken-burger.jpg"
  }

  if (name.includes("cheeseburger")) {
    return "/images/cheeseburger.jpg"
  }

  if (name.includes("burger")) {
    return "/images/cheeseburger.jpg"
  }

  // DEFAULT IMAGE
  return "/images/food-placeholder.jpg"
}


function getCategoryGroups(items: FoodItem[]) {
  const groups = new Map<string, FoodItem[]>()

  for (const category of CATEGORY_ORDER) {
    groups.set(category, [])
  }

  for (const item of items) {
    const category = item.category_name || "Other Items"

    if (!groups.has(category)) {
      groups.set(category, [])
    }

    groups.get(category)!.push(item)
  }

  return Array.from(groups.entries()).filter(
    ([, foods]) => foods.length > 0
  )
}

export default function HomePage() {
  const router = useRouter()

  const [menuItems, setMenuItems] = useState<FoodItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [showCheckout, setShowCheckout] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [deliveryContact, setDeliveryContact] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState("")
  const [orderSuccess, setOrderSuccess] = useState("")
  const [completedOrderId, setCompletedOrderId] = useState<number | null>(null)

  useEffect(() => {
    const authenticated = isAuthenticated()

    setIsLoggedIn(authenticated)
    setAuthChecking(false)

    if (!authenticated) {
      setLoading(false)
      router.replace("/login")
      return
    }

    
async function loadMenu() {
  try {
    const data = await apiClient<FoodItem[]>("/food-item", {
      requiresAuth: true,
    })

    // Gamitin ang actual availability ng lahat ng food items
    // mula sa database. Walang hard-coded overrides.
    setMenuItems(data)
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to load menu."
    )
  } finally {
    setLoading(false)
  }
}

    loadMenu()
  }, [router])

  function handleLogout() {
    clearTokens()
    setIsLoggedIn(false)
    setMenuItems([])
    setCart([])
    setQuantities({})
    setError("")
    setMessage("")
    setShowCheckout(false)
    router.replace("/login")
  }

  function changeMenuQuantity(foodItemId: number, amount: number) {
    setQuantities((current) => ({
      ...current,
      [foodItemId]: Math.max(
        1,
        (current[foodItemId] || 1) + amount
      ),
    }))
  }

  function addToCart(item: FoodItem) {
    if (item.availability !== "Available") return

    const selectedQuantity = quantities[item.food_item_id] || 1

    setCart((currentCart) => {
      const existing = currentCart.find(
        (cartItem) =>
          cartItem.food_item_id === item.food_item_id
      )

      if (existing) {
        return currentCart.map((cartItem) =>
          cartItem.food_item_id === item.food_item_id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + selectedQuantity,
              }
            : cartItem
        )
      }

      return [
        ...currentCart,
        { ...item, quantity: selectedQuantity },
      ]
    })

    setMessage(`${item.food_name} added to your cart!`)

    setQuantities((current) => ({
      ...current,
      [item.food_item_id]: 1,
    }))
  }

  function changeCartQuantity(foodItemId: number, amount: number) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.food_item_id === foodItemId
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function removeFromCart(foodItemId: number) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.food_item_id !== foodItemId
      )
    )
  }

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  )

  const cartTotal = cart.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  )

  async function handleCheckout() {
    setCheckoutError("")
    setOrderSuccess("")

    if (cart.length === 0) {
      setCheckoutError("Your cart is empty.")
      return
    }
if (!deliveryContact.trim()) {
  setCheckoutError("Please enter your contact number.")
  return
}

if (!deliveryAddress.trim()) {
  setCheckoutError("Please enter your delivery address.")
  return
}

    const userId = getCurrentUserId()

    if (!userId) {
      setCheckoutError(
        "Unable to identify your account. Please log in again."
      )
      return
    }

    setIsCheckingOut(true)

    let createdOrderId: number | null = null

    try {
      const order = await apiClient<OrderResponse>("/orders", {
        requiresAuth: true,
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          restaurant_id: 1,
          total_amount: cartTotal,
          order_status: "Pending",
        }),
      })

      createdOrderId = Number(order.order_id)

      if (!createdOrderId) {
        throw new Error(
          "The order was created but no order ID was returned."
        )
      }

      for (const item of cart) {
        await apiClient("/order-detail", {
          requiresAuth: true,
          method: "POST",
          body: JSON.stringify({
            order_id: createdOrderId,
            food_item_id: item.food_item_id,
            quantity: item.quantity,
          }),
        })
      }

      await apiClient("/payment", {
        requiresAuth: true,
        method: "POST",
        body: JSON.stringify({
          order_id: createdOrderId,
          payment_method: paymentMethod,
          amount: cartTotal,
          payment_status: "Pending",
        }),
      })

      await apiClient("/delivery", {
  requiresAuth: true,
  method: "POST",
  body: JSON.stringify({
    order_id: createdOrderId,
    delivery_contact: deliveryContact.trim(),
    delivery_address: deliveryAddress.trim(),
  }),
})

      setCompletedOrderId(createdOrderId)

      setOrderSuccess(
        `Your order has been placed successfully! Order #${createdOrderId}`
      )

      setCart([])
      setQuantities({})
      setDeliveryAddress("")
      setDeliveryContact("")
      setPaymentMethod("Cash")
      setShowCheckout(false)
      setMessage("")
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong while placing your order."

      if (createdOrderId !== null) {
        setCheckoutError(
          `Order #${createdOrderId} was already created, but a later checkout step failed: ${errorMessage} Please do not submit again yet. Check your database first to avoid duplicate orders.`
        )
      } else {
        setCheckoutError(errorMessage)
      }
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (authChecking || !isLoggedIn) {
    return <main className="min-h-screen bg-[#f8f4ec]" />
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] text-[#39291f]">


      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-[#e9dfd0] bg-[#faf8f2]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-[#493326] text-[#f8edda]">
              <UtensilsCrossed className="size-5" />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-wide text-[#493326]">
                CONSTANTINO
              </h1>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#9b7958]">
                Food House
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="#menu"
              className="hidden text-sm font-medium text-[#695344] transition hover:text-[#a16c3e] sm:block"
            >
              Our Menu
            </a>

            <a
              href="#cart"
              className="relative flex items-center gap-2 rounded-full border border-[#d9c7b1] px-3 py-2 text-sm font-semibold text-[#493326] transition hover:bg-[#eee4d6]"
            >
              <ShoppingBag className="size-4" />
              <span>Cart</span>
              <span className="flex size-5 items-center justify-center rounded-full bg-[#493326] text-xs text-white">
                {cartCount}
              </span>
            </a>

            <Link
              href="/my-orders"
              className="flex items-center gap-2 rounded-full border border-[#d9c7b1] px-3 py-2 text-sm font-semibold text-[#493326] transition hover:bg-[#eee4d6]"
            >
              <ClipboardList className="size-4" />
              <span className="hidden sm:inline">My Orders</span>
            </Link>

            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="text-[#493326] hover:bg-[#eee4d6]"
              >
                Dashboard
              </Button>
            </Link>

            <Button
              onClick={handleLogout}
              className="rounded-full bg-[#493326] px-4 text-[#fffaf1] hover:bg-[#634832]"
            >
              <LogOut className="mr-2 size-4" />
              Logout
            </Button>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#e9dfd0]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:px-8 md:py-24">
          <div className="relative z-10">
            <div className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#98734f]">
              <span className="h-px w-9 bg-[#98734f]" />
              Welcome to Constantino Food House
            </div>

            <h2 className="max-w-xl font-serif text-5xl leading-[1.15] text-[#493326] md:text-7xl">
              Good food,
              <span className="block italic text-[#a4774e]">
                made with love.
              </span>
            </h2>

            <p className="mt-7 max-w-lg text-base leading-8 text-[#766252] md:text-lg">
              Discover delicious meals and comforting favorites,
              freshly prepared and served with care. Your next
              favorite meal is just a few clicks away.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a href="#menu">
                <Button
                  size="lg"
                  className="h-12 rounded-full bg-[#493326] px-7 text-[#fffaf1] hover:bg-[#634832]"
                >
                  Explore Our Menu
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </a>

              <a
                href="#about"
                className="flex h-12 items-center px-4 text-sm font-semibold text-[#493326] hover:text-[#a4774e]"
              >
                Discover More
              </a>
            </div>

            <div className="mt-12 flex flex-wrap gap-8 border-t border-[#d3c2ad] pt-7">
              <div>
                <p className="font-serif text-2xl text-[#493326]">
                  Fresh
                </p>
                <p className="mt-1 text-xs text-[#8a7461]">
                  Prepared with care
                </p>
              </div>

              <div>
                <p className="font-serif text-2xl text-[#493326]">
                  Quality
                </p>
                <p className="mt-1 text-xs text-[#8a7461]">
                  Every single serving
                </p>
              </div>

              <div>
                <p className="font-serif text-2xl text-[#493326]">
                  Delicious
                </p>
                <p className="mt-1 text-xs text-[#8a7461]">
                  Made for your cravings
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-5 -top-5 h-40 w-40 rounded-full border border-[#c6ad91]" />

            <div className="relative overflow-hidden rounded-t-[10rem] rounded-b-3xl border-[8px] border-[#faf8f2] shadow-2xl">
              <img
                src="https://commons.wikimedia.org/wiki/Special:FilePath/Chicken%20Inasal%20Meal%2C%20Jun%202025.jpg"
                alt="Beautifully prepared meal"
                className="h-[390px] w-full object-cover md:h-[520px]"
              />
            </div>

            <div className="absolute -bottom-5 -left-4 rounded-2xl bg-[#faf8f2] p-5 shadow-xl md:-left-8">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-[#e9dfd0] text-[#725239]">
                  <Coffee className="size-5" />
                </div>

                <div>
                  <p className="font-serif text-lg text-[#493326]">
                    Made for you
                  </p>
                  <p className="text-xs text-[#927b66]">
                    A little taste of happiness
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT STRIP */}
      <section id="about" className="border-b border-[#e9dfd0] bg-[#faf8f2]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 sm:grid-cols-3 md:px-8">
          <div className="flex items-center justify-center gap-3">
            <Star className="size-6 text-[#a4774e]" />
            <div>
              <p className="font-serif text-lg text-[#493326]">
                Quality Meals
              </p>
              <p className="text-xs text-[#927b66]">
                Made with care
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Clock className="size-6 text-[#a4774e]" />
            <div>
              <p className="font-serif text-lg text-[#493326]">
                Easy Ordering
              </p>
              <p className="text-xs text-[#927b66]">
                Order your favorites
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <ShoppingBag className="size-6 text-[#a4774e]" />
            <div>
              <p className="font-serif text-lg text-[#493326]">
                Customer First
              </p>
              <p className="text-xs text-[#927b66]">
                Your satisfaction matters
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* MENU */}
      <section
        id="menu"
        className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 md:px-8 md:py-24"
      >
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#a4774e]">
            A taste worth remembering
          </p>

          <h2 className="mt-4 font-serif text-4xl text-[#493326] md:text-5xl">
            Our Menu
          </h2>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#887565]">
            Explore our selection of delicious meals, refreshing
            drinks, and satisfying treats.
          </p>

          <div className="mx-auto mt-6 h-px w-16 bg-[#b18b65]" />
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-3 py-16 text-[#76563d]">
            <Loader2 className="size-6 animate-spin" />
            <span>Preparing our menu...</span>
          </div>
        )}

        {!loading && error && (
          <div className="mx-auto max-w-xl rounded-2xl border border-[#e3d5c3] bg-[#faf8f2] p-8 text-center">
            <ShoppingBag className="mx-auto size-10 text-[#98734f]" />

            <h3 className="mt-4 font-serif text-2xl text-[#493326]">
              Unable to load the menu
            </h3>

            <p className="mt-3 text-sm text-[#887565]">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && menuItems.length === 0 && (
          <p className="py-12 text-center text-[#887565]">
            No food items are currently available.
          </p>
        )}

        {!loading && !error && menuItems.length > 0 && (
          <div className="space-y-16">
            {getCategoryGroups(menuItems).map(([category, foods]) => (
              <div key={category}>
                <div className="mb-7 flex items-center gap-4">
                  <div className="h-px flex-1 bg-[#d9c7b1]" />

                  <h3 className="font-serif text-3xl text-[#493326] md:text-4xl">
                    {category}
                  </h3>

                  <div className="h-px flex-1 bg-[#d9c7b1]" />
                </div>

                <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                  {foods.map((item) => {
                    const isAvailable =
                       item.availability?.trim().toLowerCase() === "available"

                    return (
                      <Card
                        key={item.food_item_id}
                        className="group overflow-hidden rounded-2xl border border-[#e9dfd0] bg-[#fffdf8] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                      >
                        <CardContent className="p-0">
                          <div className="relative h-56 overflow-hidden bg-[#e9dfd0]">
                            <img
                              src={getFoodImage(item.food_name)}
                              alt={item.food_name}
                              loading="lazy"
                              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                            />

                            <span className="absolute left-4 top-4 rounded-full bg-[#faf8f2]/95 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#634832] shadow-sm">
                              {category}
                            </span>
                          </div>

                          <div className="p-6">
                            <h4 className="font-serif text-2xl text-[#493326]">
                              {item.food_name}
                            </h4>

                            <p className="mt-2 min-h-12 text-sm leading-6 text-[#887565]">
                              {item.description ||
                                "A delicious favorite from Constantino Food House."}
                            </p>

                            <div className="mt-5 flex items-center justify-between border-t border-[#eee5d9] pt-5">
                              <span className="font-serif text-2xl font-bold text-[#795638]">
                                ₱{Number(item.price).toFixed(2)}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  isAvailable
                                    ? "bg-[#e8eee2] text-[#526d45]"
                                    : "bg-[#eee8e2] text-[#847365]"
                                }`}
                              >
                                {item.availability}
                              </span>
                            </div>

                            <div className="mt-5 flex items-center gap-3">
                              <div
                                className={`flex h-11 items-center overflow-hidden rounded-full border border-[#d9c7b1] ${
                                  !isAvailable ? "opacity-50" : ""
                                }`}
                              >
                                <button
                                  type="button"
                                  aria-label={`Decrease ${item.food_name} quantity`}
                                  disabled={
                                    !isAvailable ||
                                    (quantities[item.food_item_id] || 1) <= 1
                                  }
                                  className="flex h-full w-9 items-center justify-center text-[#634832] hover:bg-[#eee4d6] disabled:cursor-not-allowed disabled:opacity-40"
                                  onClick={() =>
                                    changeMenuQuantity(item.food_item_id, -1)
                                  }
                                >
                                  <Minus className="size-4" />
                                </button>

                                <span className="flex h-full min-w-9 items-center justify-center border-x border-[#e9dfd0] text-sm font-bold text-[#493326]">
                                  {quantities[item.food_item_id] || 1}
                                </span>

                                <button
                                  type="button"
                                  aria-label={`Increase ${item.food_name} quantity`}
                                  disabled={!isAvailable}
                                  className="flex h-full w-9 items-center justify-center text-[#634832] hover:bg-[#eee4d6] disabled:cursor-not-allowed disabled:opacity-40"
                                  onClick={() =>
                                    changeMenuQuantity(item.food_item_id, 1)
                                  }
                                >
                                  <Plus className="size-4" />
                                </button>
                              </div>

                             
<Button
  className={`h-11 flex-1 rounded-full text-xs font-semibold ${
    isAvailable
      ? "bg-[#493326] text-white hover:bg-[#634832]"
      : "cursor-not-allowed bg-red-600 text-white opacity-100"
  }`}
  disabled={!isAvailable}
  onClick={() => addToCart(item)}
>
  <ShoppingBag className="mr-2 size-4" />
  {isAvailable ? "Add to Cart" : "Unavailable"}
</Button>

                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>


      {/* CART */}
      <section
        id="cart"
        className="scroll-mt-24 bg-[#e9dfd0] px-5 py-20 md:px-8"
      >
        <div className="mx-auto max-w-4xl">
          <div className="mb-9 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#98734f]">
              Your favorites
            </p>

            <h2 className="mt-3 font-serif text-4xl text-[#493326]">
              Your Shopping Cart
            </h2>
          </div>

          <Card className="overflow-hidden rounded-3xl border border-[#e4d6c4] bg-[#fffdf8] shadow-lg">
            <CardContent className="p-6 md:p-9">
              <div className="flex items-center justify-between border-b border-[#eee5d9] pb-5">
                <div>
                  <h3 className="font-serif text-2xl text-[#493326]">
                    Order Summary
                  </h3>

                  <p className="mt-1 text-sm text-[#927b66]">
                    {cartCount} item(s) in your cart
                  </p>
                </div>

                <ShoppingBag className="size-7 text-[#98734f]" />
              </div>

              {message && (
                <p className="mt-5 rounded-xl bg-[#edf1e8] p-3 text-sm font-medium text-[#526d45]">
                  {message}
                </p>
              )}

              {orderSuccess && (
                <div className="mt-5 rounded-xl border border-[#cbdcc2] bg-[#edf4e9] p-5 text-[#42613a]">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="size-5" />
                    Order placed successfully!
                  </div>

                  <p className="mt-2 text-sm">{orderSuccess}</p>

                  {completedOrderId && (
                    <p className="mt-2 text-sm font-bold">
                      Order Number: #{completedOrderId}
                    </p>
                  )}

                  <p className="mt-2 text-xs">
                    Payment status: Pending
                  </p>

                  <Link
                    href="/my-orders"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-bold underline"
                  >
                    View My Orders
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#f1e9dc]">
                    <ShoppingBag className="size-7 text-[#98734f]" />
                  </div>

                  <h3 className="mt-5 font-serif text-2xl text-[#493326]">
                    Your cart is empty
                  </h3>

                  <p className="mt-2 text-sm text-[#927b66]">
                    Discover something delicious from our menu.
                  </p>

                  <a href="#menu">
                    <Button className="mt-6 rounded-full bg-[#493326] px-6 text-white hover:bg-[#634832]">
                      Browse Menu
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  {cart.map((item) => (
                    <div
                      key={item.food_item_id}
                      className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eee5d9] pb-6"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <img
                          src={getFoodImage(item.food_name)}
                          alt={item.food_name}
                          className="size-20 rounded-xl object-cover"
                        />

                        <div>
                          <h4 className="font-serif text-lg text-[#493326]">
                            {item.food_name}
                          </h4>

                          <p className="mt-1 text-sm text-[#927b66]">
                            ₱{Number(item.price).toFixed(2)} each
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          aria-label="Decrease cart quantity"
                          className="flex size-9 items-center justify-center rounded-full border border-[#d9c7b1] text-[#634832] hover:bg-[#eee4d6]"
                          onClick={() =>
                            changeCartQuantity(item.food_item_id, -1)
                          }
                        >
                          <Minus className="size-4" />
                        </button>

                        <span className="min-w-7 text-center font-semibold text-[#493326]">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          aria-label="Increase cart quantity"
                          className="flex size-9 items-center justify-center rounded-full border border-[#d9c7b1] text-[#634832] hover:bg-[#eee4d6]"
                          onClick={() =>
                            changeCartQuantity(item.food_item_id, 1)
                          }
                        >
                          <Plus className="size-4" />
                        </button>

                        <span className="w-24 text-right font-bold text-[#795638]">
                          ₱{(
                            Number(item.price) * item.quantity
                          ).toFixed(2)}
                        </span>

                        <button
                          type="button"
                          aria-label="Remove item"
                          className="flex size-9 items-center justify-center rounded-full text-[#a45b4b] hover:bg-[#f8eae5]"
                          onClick={() =>
                            removeFromCart(item.food_item_id)
                          }
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2">
                    <span className="font-medium text-[#766252]">
                      Total Amount
                    </span>

                    <span className="font-serif text-3xl font-bold text-[#493326]">
                      ₱{cartTotal.toFixed(2)}
                    </span>
                  </div>

                  {!showCheckout && (
                    <Button
                      className="h-12 w-full rounded-full bg-[#493326] text-sm font-semibold text-white hover:bg-[#634832]"
                      onClick={() => {
                        setCheckoutError("")
                        setShowCheckout(true)
                      }}
                    >
                      Proceed to Checkout
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  )}

                  {showCheckout && (
                    <div className="space-y-5 rounded-2xl border border-[#e4d6c4] bg-[#faf8f2] p-5 md:p-7">
                      <div>
                        <h3 className="font-serif text-2xl text-[#493326]">
                          Checkout Details
                        </h3>

                        <p className="mt-1 text-sm text-[#927b66]">
                          Enter your delivery information to complete your order.
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#634832]">
                          <MapPin className="size-4" />
                          Delivery Address
                        </label>

                        <textarea
                          value={deliveryAddress}
                          onChange={(event) =>
                            setDeliveryAddress(event.target.value)
                          }
                          placeholder="Enter your complete delivery address"
                          rows={3}
                          disabled={isCheckingOut}
                          className="w-full resize-none rounded-xl border border-[#d9c7b1] bg-white px-4 py-3 text-sm text-[#493326] outline-none placeholder:text-[#a99683] focus:border-[#98734f]"
                        />
                      </div>


<div>
  <label className="mb-2 block text-sm font-semibold text-[#634832]">
    Contact Number
  </label>

  <input
    type="tel"
    value={deliveryContact}
    onChange={(e) => setDeliveryContact(e.target.value)}
    placeholder="Enter your contact number"
    disabled={isCheckingOut}
    className="w-full rounded-xl border border-[#d9c7b1] bg-white px-4 py-3 text-sm text-[#493326] outline-none transition focus:border-[#493326]"
  />
</div>


                      <div>
                        <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#634832]">
                          <CreditCard className="size-4" />
                          Payment Method
                        </label>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            disabled={isCheckingOut}
                            onClick={() => setPaymentMethod("Cash")}
                            className={`rounded-xl border p-4 text-left transition ${
                              paymentMethod === "Cash"
                                ? "border-[#493326] bg-[#eee4d6]"
                                : "border-[#d9c7b1] bg-white hover:bg-[#f4eee5]"
                            }`}
                          >
                            <p className="font-semibold text-[#493326]">
                              Cash on Delivery
                            </p>

                            <p className="mt-1 text-xs text-[#927b66]">
                              Pay when your order arrives
                            </p>
                          </button>

                          <button
                            type="button"
                            disabled={isCheckingOut}
                            onClick={() => setPaymentMethod("GCash")}
                            className={`rounded-xl border p-4 text-left transition ${
                              paymentMethod === "GCash"
                                ? "border-[#493326] bg-[#eee4d6]"
                                : "border-[#d9c7b1] bg-white hover:bg-[#f4eee5]"
                            }`}
                          >
                            <p className="font-semibold text-[#493326]">
                              GCash
                            </p>

                            <p className="mt-1 text-xs text-[#927b66]">
                              Recorded as pending payment
                            </p>
                          </button>
                        </div>
                      </div>

                      <div className="rounded-xl bg-[#eee4d6] p-4">
                        <div className="flex justify-between text-sm text-[#766252]">
                          <span>Payment Method</span>

                          <span className="font-semibold text-[#493326]">
                            {paymentMethod === "Cash"
                              ? "Cash on Delivery"
                              : "GCash"}
                          </span>
                        </div>

                        <div className="mt-3 flex justify-between">
                          <span className="font-semibold text-[#493326]">
                            Total to Pay
                          </span>

                          <span className="font-serif text-2xl font-bold text-[#493326]">
                            ₱{cartTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {checkoutError && (
                        <div className="rounded-xl border border-[#e6c5b9] bg-[#fbefeb] p-4 text-sm text-[#984c3c]">
                          {checkoutError}
                        </div>
                      )}

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isCheckingOut}
                          onClick={() => {
                            setShowCheckout(false)
                            setCheckoutError("")
                          }}
                          className="h-12 flex-1 rounded-full border-[#d9c7b1] text-[#634832] hover:bg-[#eee4d6]"
                        >
                          Back to Cart
                        </Button>

                        <Button
                          type="button"
                          disabled={isCheckingOut || cart.length === 0}
                          onClick={handleCheckout}
                          className="h-12 flex-1 rounded-full bg-[#493326] text-white hover:bg-[#634832]"
                        >
                          {isCheckingOut ? (
                            <>
                              <Loader2 className="mr-2 size-4 animate-spin" />
                              Placing Order...
                            </>
                          ) : (
                            <>
                              Place Order
                              <ArrowRight className="ml-2 size-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <p className="text-center text-xs text-[#927b66]">
                    Please review your order before placing it.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#38271e] px-5 py-12 text-center text-[#e9dfd0]">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-[#927b66]">
          <UtensilsCrossed className="size-5 text-[#d3b28e]" />
        </div>

        <h3 className="mt-4 font-serif text-2xl tracking-wide text-[#fff8eb]">
          CONSTANTINO FOOD HOUSE
        </h3>

        <p className="mt-3 text-sm text-[#c6b39e]">
          Delicious moments, served with love.
        </p>

        <div className="mx-auto mt-8 h-px max-w-xs bg-[#725239]" />

        <p className="mt-6 text-xs text-[#bba58d]">
          © 2026 Constantino Food House. All rights reserved.
        </p>
      </footer>
    </main>
  )
}
