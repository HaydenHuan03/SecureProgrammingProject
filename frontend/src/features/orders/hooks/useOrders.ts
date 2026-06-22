import { useQuery } from "@tanstack/react-query";
import { listOrders } from "../../../api/orders";

export const ORDERS_KEY = ["orders"] as const;

export function useOrders() {
  return useQuery({ queryKey: ORDERS_KEY, queryFn: listOrders });
}
