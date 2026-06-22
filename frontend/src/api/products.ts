import { apiRequest } from "./client";

export interface Product {
  product_id: string;
  name: string;
  description: string;
  price: string;
  stock: number;
  created_at: string;
}

export const listProducts = () =>
  apiRequest<Product[]>("/api/products/");

export const createProduct = (data: {
  name: string;
  description: string;
  price: string;
  stock: number;
}) => apiRequest<Product>("/api/products/", { method: "POST", body: JSON.stringify(data) });

export const updateProduct = (
  productId: string,
  data: { name?: string; description?: string; price?: string; stock?: number }
) =>
  apiRequest<Product>(`/api/products/${productId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteProduct = (productId: string) =>
  apiRequest<void>(`/api/products/${productId}/`, { method: "DELETE" });
