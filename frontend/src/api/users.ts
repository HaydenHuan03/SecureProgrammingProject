import { apiRequest } from "./client";

export type Role = "user" | "admin";

export interface User {
  user_id: string;
  username: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  mfa_required: true;
  mfa_token: string;
}

export const register = (username: string, email: string, password: string) =>
  apiRequest<User>("/api/users/register/", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });

export const login = (username: string, password: string) =>
  apiRequest<LoginResponse>("/api/users/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const sendOTP = (mfa_token: string, email: string) =>
  apiRequest<{ otp_sent: true }>("/api/users/login/send-otp/", {
    method: "POST",
    body: JSON.stringify({ mfa_token, email }),
  });

export const verifyMFA = (mfa_token: string, otp_code: string) =>
  apiRequest<User>("/api/users/login/verify/", {
    method: "POST",
    body: JSON.stringify({ mfa_token, otp_code }),
  });

export const logout = () =>
  apiRequest<void>("/api/users/logout/", { method: "POST" });

export const listUsers = () =>
  apiRequest<User[]>("/api/users/");

export const createUser = (username: string, email: string, password: string, role: Role) =>
  apiRequest<User>("/api/users/", {
    method: "POST",
    body: JSON.stringify({ username, email, password, role }),
  });

export const getUser = (userId: string) =>
  apiRequest<User>(`/api/users/${userId}/`);

export const updateUser = (
  userId: string,
  data: { username?: string; email?: string; password?: string; role?: Role }
) =>
  apiRequest<User>(`/api/users/${userId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteUser = (userId: string) =>
  apiRequest<void>(`/api/users/${userId}/`, { method: "DELETE" });
