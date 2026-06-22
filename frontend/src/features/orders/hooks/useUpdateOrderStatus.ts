import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrderStatus } from "../../../api/orders";
import { ORDERS_KEY } from "./useOrders";

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}
