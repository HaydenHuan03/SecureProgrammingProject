import { useMutation } from "@tanstack/react-query";
import { register } from "../../../api/users";

export function useRegister() {
  return useMutation({
    mutationFn: ({ username, email, password }: { username: string; email: string; password: string }) =>
      register(username, email, password),
  });
}
