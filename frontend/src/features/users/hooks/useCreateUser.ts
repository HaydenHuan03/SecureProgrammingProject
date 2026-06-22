import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser, type Role } from "../../../api/users";

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ username, email, password, role }: { username: string; email: string; password: string; role: Role }) =>
      createUser(username, email, password, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}
