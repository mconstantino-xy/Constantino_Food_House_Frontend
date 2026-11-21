
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { apiClient } from "@/lib/api";
import { clearTokens, getAccessToken } from "@/lib/auth";

interface FoodItem {
  food_item_id: number;
  restaurant_id: number;
  restaurant_name?: string;
  category_id: number;
  category_name?: string;
  food_name: string;
  description: string | null;
  price: number | string;
  availability: string;
}

interface FoodForm {
  category_id: number;
  food_name: string;
  description: string;
  price: string;
  availability: string;
}

interface Order {
  order_id: number;
  user_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  restaurant_id: number;
  restaurant_name?: string;
  order_date: string;
  total_amount: number | string;
  order_status: string;
  details?: OrderDetail[];
}

interface OrderDetail {
  order_detail_id: number;
  order_id: number;
  food_item_id: number;
  food_name?: string;
  quantity: number;
  price: number | string;
  subtotal: number | string;
}

const initialForm: FoodForm = {
  category_id: 1,
  food_name: "",
  description: "",
  price: "",
  availability: "Available",
};

const categories = [
  { id: 1, name: "Rice Meals" },
  { id: 2, name: "Beverages" },
  { id: 3, name: "Snacks" },
];

const orderStatuses = [
  "Pending",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

export default function FoodManagementPage() {
  const router = useRouter();

  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [form, setForm] = useState<FoodForm>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [ordersLoading, setOrdersLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const [selectedStatuses, setSelectedStatuses] = useState<
    Record<number, string>
  >({});

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");

  // =========================
  // SIGN OUT
  // =========================

  const handleSignOut = () => {
    clearTokens();
    router.replace("/login");
  };

  // =========================
  // FOOD ITEMS
  // =========================

  const fetchFoods = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiClient<FoodItem[]>("/food-item", {
        method: "GET",
        requiresAuth: true,
      });

      setFoods(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load food items."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================
  // CUSTOMER ORDERS
  // =========================

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrderError("");
    setOrderSuccess("");

    try {
      const orderData = await apiClient<Order[]>("/orders", {
        method: "GET",
        requiresAuth: true,
      });

      const safeOrders = Array.isArray(orderData) ? orderData : [];

      const ordersWithDetails = await Promise.all(
        safeOrders.map(async (order) => {
          try {
            const details = await apiClient<OrderDetail[]>(
              `/order-detail/order/${order.order_id}`,
              {
                method: "GET",
                requiresAuth: true,
              }
            );

            return {
              ...order,
              details: Array.isArray(details) ? details : [],
            };
          } catch {
            return {
              ...order,
              details: [],
            };
          }
        })
      );

      setOrders(ordersWithDetails);

      const statusMap: Record<number, string> = {};

      ordersWithDetails.forEach((order) => {
        statusMap[order.order_id] = order.order_status;
      });

      setSelectedStatuses(statusMap);
    } catch (err) {
      setOrderError(
        err instanceof Error
          ? err.message
          : "Failed to load customer orders."
      );
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    if (!getAccessToken()) {
      setError("Please log in first to manage food items.");
      setOrderError("Please log in first to view customer orders.");
      setLoading(false);
      setOrdersLoading(false);
      return;
    }

    fetchFoods();
    fetchOrders();
  }, [fetchFoods, fetchOrders]);

  // =========================
  // ADD / UPDATE FOOD ITEM
  // =========================

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.food_name.trim() || !form.price) {
      setError("Please enter the food name and price.");
      return;
    }

    const price = Number(form.price);

    if (!Number.isFinite(price) || price <= 0) {
      setError("Price must be greater than zero.");
      return;
    }

    const payload = {
      restaurant_id: 1,
      category_id: Number(form.category_id),
      food_name: form.food_name.trim(),
      description: form.description.trim(),
      price,
      availability: form.availability,
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await apiClient(`/food-item/${editingId}`, {
          method: "PUT",
          requiresAuth: true,
          body: JSON.stringify(payload),
        });

        setSuccess("Food item updated successfully!");
      } else {
        await apiClient("/food-item", {
          method: "POST",
          requiresAuth: true,
          body: JSON.stringify(payload),
        });

        setSuccess("Food item added successfully!");
      }

      setForm(initialForm);
      setEditingId(null);
      await fetchFoods();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save food item."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // EDIT FOOD ITEM
  // =========================

  const handleEdit = (food: FoodItem) => {
    setEditingId(food.food_item_id);

    setForm({
      category_id: food.category_id,
      food_name: food.food_name,
      description: food.description || "",
      price: String(food.price),
      availability: food.availability,
    });

    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // =========================
  // DELETE FOOD ITEM
  // =========================

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this food item?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await apiClient(`/food-item/${id}`, {
        method: "DELETE",
        requiresAuth: true,
      });

      setSuccess("Food item deleted successfully!");
      await fetchFoods();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete food item."
      );
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
  };

  // =========================
  // UPDATE CUSTOMER ORDER STATUS
  // =========================

  const handleUpdateOrderStatus = async (orderId: number) => {
    const newStatus = selectedStatuses[orderId];

    if (!newStatus) {
      setOrderError("Please select an order status.");
      return;
    }

    setOrderError("");
    setOrderSuccess("");
    setUpdatingOrderId(orderId);

    try {
      await apiClient(`/orders/${orderId}`, {
        method: "PUT",
        requiresAuth: true,
        body: JSON.stringify({
          order_status: newStatus,
        }),
      });

      setOrderSuccess(
        `Order #${orderId} status updated to ${newStatus} successfully!`
      );

      await fetchOrders();
    } catch (err) {
      setOrderError(
        err instanceof Error
          ? err.message
          : "Unable to update order status."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // =========================
  // CUSTOMER NAME
  // =========================

  const getCustomerName = (order: Order) => {
    const fullName = `${order.first_name || ""} ${
      order.last_name || ""
    }`.trim();

    return fullName || order.username || `Customer #${order.user_id}`;
  };

  // =========================
  // DATE FORMAT
  // =========================

  const formatOrderDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleString();
  };

  // =========================
  // ORDER STATUS COLORS
  // =========================

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";

      case "Preparing":
        return "bg-blue-100 text-blue-800";

      case "Out for Delivery":
        return "bg-orange-100 text-orange-800";

      case "Delivered":
      case "Completed":
        return "bg-green-100 text-green-800";

      case "Cancelled":
        return "bg-red-100 text-red-800";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  function getStatusColor(order_status: string) {
    switch (order_status.trim().toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";

      case "preparing":
        return "bg-blue-100 text-blue-800";

      case "out for delivery":
        return "bg-orange-100 text-orange-800";

      case "delivered":
      case "completed":
        return "bg-green-100 text-green-800";

      case "cancelled":
      case "canceled":
        return "bg-red-100 text-red-800";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  return (
    <main className="min-h-screen bg-[#E9DECE] px-4 py-10 text-[#4B3023]">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#A87950]">
              Constantino Food House
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-[#765A47]">
              Manage your restaurant menu and customer orders.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-lg bg-[#4B3023] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#624331]"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

        {/* FOOD ERROR MESSAGE */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* FOOD SUCCESS MESSAGE */}
        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* ADD / UPDATE FOOD FORM */}
        <section className="mb-10 rounded-2xl border border-[#D6C3AD] bg-[#FAF8F3] p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-[#4B3023]">
            {editingId !== null
              ? "Update Food Item"
              : "Add New Food Item"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold">
                Food Name
              </label>

              <input
                type="text"
                value={form.food_name}
                onChange={(e) =>
                  setForm({ ...form, food_name: e.target.value })
                }
                placeholder="Enter food name"
                className="w-full rounded-lg border border-[#D6C3AD] bg-white px-4 py-3 outline-none focus:border-[#A87950] focus:ring-2 focus:ring-[#A87950]/20"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">
                Description
              </label>

              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Enter food description"
                rows={3}
                className="w-full rounded-lg border border-[#D6C3AD] bg-white px-4 py-3 outline-none focus:border-[#A87950] focus:ring-2 focus:ring-[#A87950]/20"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Category
                </label>

                <select
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category_id: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-[#D6C3AD] bg-white px-4 py-3 outline-none focus:border-[#A87950]"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Price (₱)
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  placeholder="0.00"
                  className="w-full rounded-lg border border-[#D6C3AD] bg-white px-4 py-3 outline-none focus:border-[#A87950]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Availability
                </label>

                <select
                  value={form.availability}
                  onChange={(e) =>
                    setForm({ ...form, availability: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#D6C3AD] bg-white px-4 py-3 outline-none focus:border-[#A87950]"
                >
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#4B3023] px-6 py-3 font-semibold text-white transition hover:bg-[#624331] disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Update Food Item"
                    : "Add Food Item"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg border border-[#B99A7B] px-6 py-3 font-semibold text-[#4B3023] transition hover:bg-[#E9DECE]"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* FOOD ITEMS TABLE */}
        <section className="mb-10 rounded-2xl border border-[#D6C3AD] bg-[#FAF8F3] p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#4B3023]">
                Food Items List
              </h2>

              <p className="mt-1 text-sm text-[#765A47]">
                Total food items: {foods.length}
              </p>
            </div>

            <button
              type="button"
              onClick={fetchFoods}
              className="rounded-lg border border-[#B99A7B] px-4 py-2 text-sm font-semibold text-[#4B3023] transition hover:bg-[#E9DECE]"
            >
              Refresh List
            </button>
          </div>

          {loading ? (
            <p className="py-8 text-center text-[#765A47]">
              Loading food items...
            </p>
          ) : foods.length === 0 ? (
            <p className="py-8 text-center text-[#765A47]">
              No food items found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="border-b border-[#D6C3AD] bg-[#E9DECE] text-[#4B3023]">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Food Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Availability</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {foods.map((food) => (
                    <tr
                      key={food.food_item_id}
                      className="border-b border-[#E9DECE] last:border-0 hover:bg-[#F5EFE6]"
                    >
                      <td className="px-4 py-4">
                        {food.food_item_id}
                      </td>

                      <td className="px-4 py-4 font-semibold text-[#4B3023]">
                        {food.food_name}

                        <p className="mt-1 max-w-xs truncate text-xs font-normal text-[#8B735F]">
                          {food.description}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        {food.category_name ||
                          categories.find(
                            (category) =>
                              category.id === food.category_id
                          )?.name ||
                          food.category_id}
                      </td>

                      <td className="px-4 py-4 font-semibold">
                        ₱{Number(food.price).toFixed(2)}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            food.availability === "Available"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {food.availability}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(food)}
                            className="rounded-md bg-[#A87950] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#8F6543]"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(food.food_item_id)
                            }
                            className="rounded-md bg-[#4B3023] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#624331]"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* CUSTOMER ORDERS MANAGEMENT */}
        <section className="rounded-2xl border border-[#D6C3AD] bg-[#FAF8F3] p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#4B3023]">
                Customer Orders Management
              </h2>

              <p className="mt-1 text-sm text-[#765A47]">
                View customer orders and update their order status.
              </p>

              <p className="mt-1 text-sm font-semibold text-[#A87950]">
                Total customer orders: {orders.length}
              </p>
            </div>

            <button
              type="button"
              onClick={fetchOrders}
              disabled={ordersLoading}
              className="rounded-lg border border-[#B99A7B] px-4 py-2 text-sm font-semibold text-[#4B3023] transition hover:bg-[#E9DECE] disabled:opacity-50"
            >
              {ordersLoading ? "Refreshing..." : "Refresh Orders"}
            </button>
          </div>

          {orderError && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {orderError}
            </div>
          )}

          {orderSuccess && (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {orderSuccess}
            </div>
          )}

          {ordersLoading ? (
            <p className="py-8 text-center text-[#765A47]">
              Loading customer orders...
            </p>
          ) : orders.length === 0 ? (
            <p className="py-8 text-center text-[#765A47]">
              No customer orders found.
            </p>
          ) : (
            <div className="space-y-5">
              {orders.map((order) => (
                <div
                  key={order.order_id}
                  className="rounded-xl border border-[#D6C3AD] bg-white p-5 shadow-sm"
                >
                  {/* ORDER HEADER */}
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#A87950]">
                        Order Number
                      </p>

                      <h3 className="mt-1 text-2xl font-bold text-[#4B3023]">
                        #{order.order_id}
                      </h3>

                      <p className="mt-2 text-sm font-semibold text-[#4B3023]">
                        Customer: {getCustomerName(order)}
                      </p>

                      <p className="mt-1 text-xs text-[#8B735F]">
                        Username: {order.username || "Not available"}
                      </p>

                      {order.email && (
                        <p className="mt-1 text-xs text-[#8B735F]">
                          Email: {order.email}
                        </p>
                      )}
                    </div>

                    <span
                     className={`rounded-full px-4 py-2 text-xs font-bold ${getStatusColor(
                        order.order_status
                      )}`}
                    >
                      {order.order_status}
                    </span>
                  </div>

                  {/* ORDER INFORMATION */}
                  <div className="mb-4 grid gap-3 rounded-lg bg-[#F5EFE6] p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-[#8B735F]">
                        Order Date
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {formatOrderDate(order.order_date)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#8B735F]">
                        Restaurant
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {order.restaurant_name || "Constantino Food House"}
                      </p>
                    </div>
                  </div>

                  {/* ORDERED FOOD ITEMS */}
                  <div className="mb-4">
                    <h4 className="mb-3 font-bold text-[#4B3023]">
                      Ordered Food Items
                    </h4>

                    {!order.details || order.details.length === 0 ? (
                      <p className="rounded-lg bg-[#F5EFE6] p-4 text-sm text-[#8B735F]">
                        No order details available for this order.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[450px] text-left text-sm">
                          <thead className="bg-[#E9DECE]">
                            <tr>
                              <th className="px-3 py-2">Food Name</th>
                              <th className="px-3 py-2 text-center">
                                Quantity
                              </th>
                              <th className="px-3 py-2 text-right">
                                Price
                              </th>
                              <th className="px-3 py-2 text-right">
                                Subtotal
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {order.details.map((detail) => (
                              <tr
                                key={detail.order_detail_id}
                                className="border-b border-[#E9DECE]"
                              >
                                <td className="px-3 py-3 font-semibold">
                                  {detail.food_name ||
                                    `Food #${detail.food_item_id}`}
                                </td>

                                <td className="px-3 py-3 text-center">
                                  {detail.quantity}
                                </td>

                                <td className="px-3 py-3 text-right">
                                  ₱{Number(detail.price).toFixed(2)}
                                </td>

                                <td className="px-3 py-3 text-right font-semibold">
                                  ₱{Number(detail.subtotal).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* TOTAL AMOUNT */}
                  <div className="mb-5 flex items-center justify-between rounded-lg bg-[#E9DECE] p-4">
                    <span className="font-bold text-[#4B3023]">
                      Total Amount
                    </span>

                    <span className="text-xl font-bold text-[#4B3023]">
                      ₱{Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>

                  {/* UPDATE ORDER STATUS */}
                  <div className="border-t border-[#E9DECE] pt-4">
                    <h4 className="mb-3 font-bold text-[#4B3023]">
                      Update Customer Order Status
                    </h4>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <select
                        value={
                          selectedStatuses[order.order_id] ||
                          order.order_status
                        }
                        onChange={(e) =>
                          setSelectedStatuses((previous) => ({
                            ...previous,
                            [order.order_id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-[#D6C3AD] bg-white px-4 py-3 text-sm outline-none focus:border-[#A87950] sm:flex-1"
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}

                        {!orderStatuses.includes(order.order_status) && (
                          <option value={order.order_status}>
                            {order.order_status}
                          </option>
                        )}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateOrderStatus(order.order_id)
                        }
                        disabled={
                          updatingOrderId === order.order_id ||
                          selectedStatuses[order.order_id] ===
                            order.order_status
                        }
                        className="rounded-lg bg-[#4B3023] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#624331] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingOrderId === order.order_id
                          ? "Updating..."
                          : "Save Status"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-8 text-center text-sm text-[#8B735F]">
          © {new Date().getFullYear()} Constantino Food House
        </footer>

      </div>
    </main>
  );
}
