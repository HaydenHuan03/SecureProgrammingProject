import { useQuery } from "@tanstack/react-query";
import { listProducts } from "../../../api/products";

export const PRODUCTS_KEY = ["products"] as const;

export function useProducts() {
  return useQuery({ queryKey: PRODUCTS_KEY, queryFn: listProducts });
}
