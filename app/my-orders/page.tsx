
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  Loader2,
  RefreshCw,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Package,
  CreditCard,
  MapPin,
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { getCurrentUserId, isAuthenticated } from "@/lib/auth"

type Order = {
  order_id: number
  user_id: number
  restaurant_id: number
  order_date: string
  total_amount: number | string
  order_status: string
}

type OrderDetail = {
  order_detail_id?: number
  food_item_id: number
  food_name?: string
  quantity: number
  price: number | string
  subtotal: number | string
}

type Payment = {
  order_id: number
  payment_method?: string
  amount?: number | string
  payment_status?: string
}

type Delivery = {
  order_id: number
  delivery_address?: string
  delivery_status?: string
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)
  const [details, setDetails] = useState<Record<number, OrderDetail[]>>({})
  const [payments, setPayments] = useState<Record<number, Payment | null>>({})
  const [deliveries, setDeliveries] = useState<Record<number, Delivery | null>>({})
  const [detailLoading, setDetailLoading] = useState<number | null>(null)
  const [detailErrors, setDetailErrors] = useState<Record<number, string>>({})

 
async function loadOrders() {
  setLoading(true)
  setError("")

  try {
    if (!isAuthenticated()) {
      window.location.href = "/login"
      return
    }

    const userId = getCurrentUserId()

    if (!userId) {
      throw new Error("Unable to identify your account. Please log in again.")
    }

    const data = await apiClient<Order[]>(
      `/orders/user/${userId}`,
      { requiresAuth: true }
    )

    setOrders(Array.isArray(data) ? data : [])
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Unable to load your orders."
    )
  } finally {
    setLoading(false)
  }
}

useEffect(() => {
  loadOrders()
}, [])

async function loadOrderDetails(orderId: number) {
  setDetailLoading(orderId)
  setDetailErrors((previous) => ({ ...previous, [orderId]: "" }))

  try {
    const [detailData, paymentData, deliveryData] = await Promise.all([
      apiClient<OrderDetail[]>(
        `/order-detail/order/${orderId}`,
        { requiresAuth: true }
      ),
      apiClient<Payment>(
        "/payment",
        { requiresAuth: true }
      ),
      apiClient<Delivery[]>(
        "/delivery",
        { requiresAuth: true }
      ),
    ])

    setDetails((previous) => ({
      ...previous,
      [orderId]: Array.isArray(detailData) ? detailData : [],
    }))

    setPayments((previous) => ({
      ...previous,
      [orderId]: Array.isArray(paymentData)
        ? paymentData.find((item) => Number(item.order_id) === orderId) || null
        : null,
    }))

    setDeliveries((previous) => ({
      ...previous,
      [orderId]: Array.isArray(deliveryData)
        ? deliveryData.find((item) => Number(item.order_id) === orderId) || null
        : null,
    }))
  } catch (err) {
    setDetailErrors((previous) => ({
      ...previous,
      [orderId]:
        err instanceof Error
          ? err.message
          : "Unable to load order details.",
    }))
  } finally {
    setDetailLoading(null)
  }
}



  async function toggleDetails(orderId: number) {
    if (expandedOrder === orderId) {
      setExpandedOrder(null)
      return
    }

    setExpandedOrder(orderId)

    if (details[orderId] === undefined) {
      await loadOrderDetails(orderId)
    }
  }

  function formatPrice(amount: number | string) {
    return `₱${Number(amount).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  function formatDate(date: string) {
    if (!date) return "Date unavailable"

    const parsed = new Date(date)

    if (Number.isNaN(parsed.getTime())) return date

    return parsed.toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  function statusStyle(status: string) {
    const value = status?.toLowerCase()

    if (value === "delivered" || value === "completed" || value === "paid") {
      return "bg-green-100 text-green-700"
    }

    if (value === "cancelled" || value === "failed") {
      return "bg-red-100 text-red-700"
    }

    return "bg-amber-100 text-amber-800"
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-[#493629]">
      <header className="border-b border-[#e8dfd2] bg-[#fffdf9]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-[#76563d] hover:text-[#a8794f]"
          >
            <ArrowLeft size={18} />
            Back to Menu
          </Link>

          <div className="flex items-center gap-2 font-bold tracking-wide">
            <ShoppingBag size={21} />
            CONSTANTINO FOOD HOUSE
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-9 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#a8794f]">
              Your Account
            </p>

            <h1 className="text-3xl font-bold md:text-4xl">
              My Orders
            </h1>

            <p className="mt-2 text-[#897867]">
              Keep track of your delicious orders.
            </p>
          </div>

          <button
            onClick={loadOrders}
            disabled={loading}
            className="flex items-center gap-2 rounded-full border border-[#d8c7b5] bg-white px-5 py-3 text-sm font-semibold hover:bg-[#f5eee5] disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh Orders
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-[#a8794f]" size={36} />
            <p className="text-[#897867]">Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-semibold text-red-700">
              Unable to load your orders
            </p>
            <p className="mt-2 text-sm text-red-600">{error}</p>

            <button
              onClick={loadOrders}
              className="mt-5 rounded-full bg-[#76563d] px-6 py-3 text-sm font-semibold text-white hover:bg-[#60432f]"
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-[#e8dfd2] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5eee5]">
              <ClipboardList size={30} className="text-[#a8794f]" />
            </div>

            <h2 className="text-xl font-bold">No orders yet</h2>

            <p className="mx-auto mt-2 max-w-sm text-sm text-[#897867]">
              You haven't placed any orders yet. Explore our menu and find
              something delicious!
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-full bg-[#76563d] px-7 py-3 text-sm font-semibold text-white hover:bg-[#60432f]"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-[#897867]">
              You have {orders.length} order(s).
            </p>

            {orders.map((order) => (
              <article
                key={order.order_id}
                className="overflow-hidden rounded-2xl border border-[#e8dfd2] bg-white shadow-sm"
              >
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#a8794f]">
                        Order Number
                      </p>

                      <h2 className="mt-1 text-xl font-bold">
                        #{order.order_id}
                      </h2>

                      <p className="mt-2 flex items-center gap-2 text-sm text-[#897867]">
                        <Clock size={15} />
                        {formatDate(order.order_date)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-xs font-bold ${statusStyle(order.order_status)}`}
                    >
                      {order.order_status || "Pending"}
                    </span>
                  </div>

                  <div className="my-5 border-t border-dashed border-[#e8dfd2]" />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-[#897867]">Total Amount</p>

                      <p className="mt-1 text-2xl font-bold text-[#76563d]">
                        {formatPrice(order.total_amount)}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleDetails(order.order_id)}
                      className="flex items-center gap-2 rounded-full bg-[#76563d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#60432f]"
                    >
                      {expandedOrder === order.order_id
                        ? "Hide Details"
                        : "View Details"}

                      {expandedOrder === order.order_id ? (
                        <ChevronUp size={17} />
                      ) : (
                        <ChevronDown size={17} />
                      )}
                    </button>
                  </div>
                </div>

                {expandedOrder === order.order_id && (
                  <div className="border-t border-[#e8dfd2] bg-[#fffdf9] p-6">
                    {detailLoading === order.order_id ? (
                      <div className="flex items-center justify-center gap-3 py-8">
                        <Loader2
                          className="animate-spin text-[#a8794f]"
                          size={25}
                        />
                        <span className="text-sm text-[#897867]">
                          Loading order details...
                        </span>
                      </div>
                    ) : detailErrors[order.order_id] ? (
                      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                        {detailErrors[order.order_id]}
                        <button
                          onClick={() => loadOrderDetails(order.order_id)}
                          className="ml-2 font-bold underline"
                        >
                          Try again
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-7">
                        <div>
                          <h3 className="mb-4 flex items-center gap-2 font-bold">
                            <Package size={19} className="text-[#a8794f]" />
                            Ordered Items
                          </h3>

                          {details[order.order_id]?.length ? (
                            <div className="space-y-3">
                              {details[order.order_id].map((item, index) => (
                                <div
                                  key={item.order_detail_id ?? `${item.food_item_id}-${index}`}
                                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eee4d8] bg-white p-4"
                                >
                                  <div>
                                    <p className="font-semibold">
                                      {item.food_name ||
                                        `Food Item #${item.food_item_id}`}
                                    </p>
                                    <p className="mt-1 text-sm text-[#897867]">
                                      Quantity: {item.quantity} ×{" "}
                                      {formatPrice(item.price)}
                                    </p>
                                  </div>

                                  <p className="font-bold text-[#76563d]">
                                    {formatPrice(item.subtotal)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="rounded-xl bg-white p-4 text-sm text-[#897867]">
                              No item details found for this order.
                            </p>
                          )}
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <div className="rounded-xl border border-[#eee4d8] bg-white p-5">
                            <h3 className="mb-3 flex items-center gap-2 font-bold">
                              <CreditCard
                                size={18}
                                className="text-[#a8794f]"
                              />
                              Payment Information
                            </h3>

                            {payments[order.order_id] ? (
                              <>
                                <p className="text-sm text-[#897867]">
                                  Payment Method
                                </p>
                                <p className="mt-1 font-semibold">
                                  {payments[order.order_id]?.payment_method ||
                                    "Not specified"}
                                </p>

                                <p className="mt-3 text-sm text-[#897867]">
                                  Payment Status
                                </p>
                                <span
                                  className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusStyle(payments[order.order_id]?.payment_status || "Pending")}`}
                                >
                                  {payments[order.order_id]?.payment_status ||
                                    "Pending"}
                                </span>
                              </>
                            ) : (
                              <p className="text-sm text-[#897867]">
                                No payment record found.
                              </p>
                            )}
                          </div>

                          <div className="rounded-xl border border-[#eee4d8] bg-white p-5">
                            <h3 className="mb-3 flex items-center gap-2 font-bold">
                              <MapPin
                                size={18}
                                className="text-[#a8794f]"
                              />
                              Delivery Information
                            </h3>

                            {deliveries[order.order_id] ? (
                              <>
                                <p className="text-sm text-[#897867]">
                                  Delivery Address
                                </p>
                                <p className="mt-1 font-semibold">
                                  {deliveries[order.order_id]?.delivery_address ||
                                    "Not specified"}
                                </p>

                                <p className="mt-3 text-sm text-[#897867]">
                                  Delivery Status
                                </p>
                                <span
                                  className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusStyle(deliveries[order.order_id]?.delivery_status || "Pending")}`}
                                >
                                  {deliveries[order.order_id]?.delivery_status ||
                                    "Pending"}
                                </span>
                              </>
                            ) : (
                              <p className="text-sm text-[#897867]">
                                No delivery record found.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-dashed border-[#e8dfd2] pt-5">
                          <span className="font-semibold">Order Total</span>
                          <span className="text-xl font-bold text-[#76563d]">
                            {formatPrice(order.total_amount)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-[#e8dfd2] bg-[#fffdf9] py-6 text-center text-sm text-[#897867]">
        © 2026 Constantino Food House. All rights reserved.
      </footer>
    </main>
  )
}
