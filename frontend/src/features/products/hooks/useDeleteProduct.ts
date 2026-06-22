import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProduct } from "../../../api/products";
import { PRODUCTS_KEY } from "./useProducts";

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}
