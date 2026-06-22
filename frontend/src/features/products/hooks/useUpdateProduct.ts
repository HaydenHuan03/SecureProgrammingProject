import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProduct } from "../../../api/products";
import { PRODUCTS_KEY } from "./useProducts";

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: Parameters<typeof updateProduct>[1] }) =>
      updateProduct(productId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}
