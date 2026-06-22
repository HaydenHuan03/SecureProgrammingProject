import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrder } from "../../../api/orders";
import { ORDERS_KEY } from "./useOrders";
import { PRODUCTS_KEY } from "../../products/hooks/useProducts";

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORDERS_KEY });
      // Stock levels changed — refresh product list too
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}
