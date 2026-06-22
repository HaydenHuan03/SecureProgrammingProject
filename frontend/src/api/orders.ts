import { apiRequest } from "./client";

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface Order {
  order_id: string;
  user_id: string;
  status: string;
  total_price: string;
  created_at: string;
  items: OrderItem[];
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const listOrders = () => apiRequest<Order[]>("/api/orders/");

export const createOrder = (items: { product_id: string; quantity: number }[]) =>
  apiRequest<Order>("/api/orders/", {
    method: "POST",
    body: JSON.stringify({ items }),
  });

export const updateOrderStatus = (orderId: string, status: string) =>
  apiRequest<Order>(`/api/orders/${orderId}/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
