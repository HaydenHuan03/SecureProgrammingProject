import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct } from "../../../api/products";
import { PRODUCTS_KEY } from "./useProducts";

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}
