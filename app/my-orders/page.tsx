
"use client"

import { useCallback, useEffect, useState } from "react"
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
  Phone,
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
  payment_id?: number
  order_id: number
  payment_method?: string
  amount?: number | string
  payment_status?: string
}

type Delivery = {
  delivery_id?: number
  order_id: number
  delivery_contact?: string
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

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      if (!isAuthenticated()) {
        throw new Error("Please sign in to view your orders.")
      }

      const userId = getCurrentUserId()

      if (!userId) {
        throw new Error("Unable to identify your account.")
      }

      const data = await apiClient<Order[]>(
        `/orders/user/${userId}`,
        {
          method: "GET",
          requiresAuth: true,
        }
      )

      setOrders(Array.isArray(data) ? data : [])

      // Clear cached details so the latest information can be loaded.
      setDetails({})
      setPayments({})
      setDeliveries({})
      setDetailErrors({})
      setExpandedOrder(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your orders."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  async function loadOrderDetails(orderId: number) {
    setDetailLoading(orderId)

    setDetailErrors((previous) => ({
      ...previous,
      [orderId]: "",
    }))

    try {
      // Load ordered food items.
      const detailData = await apiClient<OrderDetail[]>(
        `/order-detail/order/${orderId}`,
        {
          method: "GET",
          requiresAuth: true,
        }
      )

      setDetails((previous) => ({
        ...previous,
        [orderId]: Array.isArray(detailData) ? detailData : [],
      }))

      // Load payment information independently.
      try {
        const paymentData = await apiClient<Payment | null>(
          `/payment/order/${orderId}`,
          {
            method: "GET",
            requiresAuth: true,
          }
        )

        setPayments((previous) => ({
          ...previous,
          [orderId]: paymentData || null,
        }))
      } catch (paymentError) {
        console.error(
          `Unable to load payment for order ${orderId}:`,
          paymentError
        )

        setPayments((previous) => ({
          ...previous,
          [orderId]: null,
        }))
      }

      // Load delivery information independently.
      try {
        const deliveryData = await apiClient<Delivery | null>(
          `/delivery/order/${orderId}`,
          {
            method: "GET",
            requiresAuth: true,
          }
        )

        setDeliveries((previous) => ({
          ...previous,
          [orderId]: deliveryData || null,
        }))
      } catch (deliveryError) {
        console.error(
          `Unable to load delivery for order ${orderId}:`,
          deliveryError
        )

        setDeliveries((previous) => ({
          ...previous,
          [orderId]: null,
        }))
      }
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

    // Always reload when opening View Details.
    await loadOrderDetails(orderId)
  }

  function formatPrice(amount: number | string | undefined) {
    const value = Number(amount ?? 0)

    return `₱${value.toLocaleString("en-PH", {
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
  const value = status?.trim().toLowerCase()

  // GREEN: Available, Delivered, Completed, Paid
  if (
    value === "available" ||
    value === "delivered" ||
    value === "completed" ||
    value === "paid"
  ) {
    return "bg-green-100 text-green-700 border border-green-200"
  }

  // BLUE: Preparing
  if (value === "preparing") {
    return "bg-blue-100 text-blue-700 border border-blue-200"
  }

  // ORANGE: Out for Delivery
  if (value === "out for delivery") {
    return "bg-orange-100 text-orange-700 border border-orange-200"
  }

  // RED: Cancelled, Failed, Unavailable
  if (
    value === "cancelled" ||
    value === "failed" ||
    value === "unavailable"
  ) {
    return "bg-red-100 text-red-700 border border-red-200"
  }

  // YELLOW: Pending
  if (value === "pending") {
    return "bg-amber-100 text-amber-800 border border-amber-200"
  }

  return "bg-gray-100 text-gray-700 border border-gray-200"
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
            onClick={() => void loadOrders()}
            disabled={loading}
            className="flex items-center gap-2 rounded-full border border-[#d8c7b5] bg-white px-5 py-3 text-sm font-semibold hover:bg-[#f5eee5] disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh Orders
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <Loader2
              className="animate-spin text-[#a8794f]"
              size={36}
            />
            <p className="text-[#897867]">
              Loading your orders...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-semibold text-red-700">
              Unable to load your orders
            </p>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={() => void loadOrders()}
              className="mt-5 rounded-full bg-[#76563d] px-6 py-3 text-sm font-semibold text-white hover:bg-[#60432f]"
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-[#e8dfd2] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5eee5]">
              <ClipboardList
                size={30}
                className="text-[#a8794f]"
              />
            </div>

            <h2 className="text-xl font-bold">
              No orders yet
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm text-[#897867]">
              You haven't placed any orders yet. Explore our menu
              and find something delicious!
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

            {orders.map((order) => {
              const payment = payments[order.order_id]
              const delivery = deliveries[order.order_id]

              return (
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
                        <p className="text-sm text-[#897867]">
                          Total Amount
                        </p>

                        <p className="mt-1 text-2xl font-bold text-[#76563d]">
                          {formatPrice(order.total_amount)}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          void toggleDetails(order.order_id)
                        }
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
                            onClick={() =>
                              void loadOrderDetails(order.order_id)
                            }
                            className="ml-2 font-bold underline"
                          >
                            Try again
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-7">
                          {/* ORDERED ITEMS */}
                          <div>
                            <h3 className="mb-4 flex items-center gap-2 font-bold">
                              <Package
                                size={19}
                                className="text-[#a8794f]"
                              />
                              Ordered Items
                            </h3>

                            {details[order.order_id]?.length ? (
                              <div className="space-y-3">
                                {details[order.order_id].map(
                                  (item, index) => (
                                    <div
                                      key={
                                        item.order_detail_id ??
                                        `${item.food_item_id}-${index}`
                                      }
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
                                  )
                                )}
                              </div>
                            ) : (
                              <p className="rounded-xl bg-white p-4 text-sm text-[#897867]">
                                No item details found for this order.
                              </p>
                            )}
                          </div>

                          {/* PAYMENT AND DELIVERY */}
                          <div className="grid gap-5 md:grid-cols-2">
                            {/* PAYMENT INFORMATION */}
                            <div className="rounded-xl border border-[#eee4d8] bg-white p-5">
                              <h3 className="mb-4 flex items-center gap-2 font-bold">
                                <CreditCard
                                  size={18}
                                  className="text-[#a8794f]"
                                />
                                Payment Information
                              </h3>

                              {payment ? (
                                <>
                                  <p className="text-sm text-[#897867]">
                                    Payment Method
                                  </p>

                                  <p className="mt-1 font-semibold">
                                    {payment.payment_method ||
                                      "Not specified"}
                                  </p>

                                  <p className="mt-3 text-sm text-[#897867]">
                                    Payment Amount
                                  </p>

                                  <p className="mt-1 font-semibold">
                                    {formatPrice(
                                      payment.amount ?? order.total_amount
                                    )}
                                  </p>

                                  <p className="mt-3 text-sm text-[#897867]">
                                    Payment Status
                                  </p>

                                  <span
                                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusStyle(payment.payment_status || "Pending")}`}
                                  >
                                    {payment.payment_status || "Pending"}
                                  </span>
                                </>
                              ) : (
                                <p className="text-sm text-[#897867]">
                                  No payment record found for this order.
                                </p>
                              )}
                            </div>

                            {/* DELIVERY INFORMATION */}
                            <div className="rounded-xl border border-[#eee4d8] bg-white p-5">
                              <h3 className="mb-4 flex items-center gap-2 font-bold">
                                <MapPin
                                  size={18}
                                  className="text-[#a8794f]"
                                />
                                Delivery Information
                              </h3>

                              {delivery ? (
                                <>
                                  <p className="flex items-center gap-2 text-sm text-[#897867]">
                                    <Phone size={14} />
                                    Contact Number
                                  </p>

                                  <p className="mt-1 font-semibold">
                                    {delivery.delivery_contact ||
                                      "Not specified"}
                                  </p>

                                  <p className="mt-3 text-sm text-[#897867]">
                                    Delivery Address
                                  </p>

                                  <p className="mt-1 font-semibold">
                                    {delivery.delivery_address ||
                                      "Not specified"}
                                  </p>

                                  <p className="mt-3 text-sm text-[#897867]">
                                    Delivery Status
                                  </p>

                                  <span
                                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusStyle(delivery.delivery_status || "Pending")}`}
                                  >
                                    {delivery.delivery_status || "Pending"}
                                  </span>
                                </>
                              ) : (
                                <p className="text-sm text-[#897867]">
                                  No delivery record found for this order.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* ORDER TOTAL */}
                          <div className="flex items-center justify-between border-t border-dashed border-[#e8dfd2] pt-5">
                            <span className="font-semibold">
                              Order Total
                            </span>

                            <span className="text-xl font-bold text-[#76563d]">
                              {formatPrice(order.total_amount)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <footer className="border-t border-[#e8dfd2] bg-[#fffdf9] py-6 text-center text-sm text-[#897867]">
        © 2026 Constantino Food House. All rights reserved.
      </footer>
    </main>
  )
}
