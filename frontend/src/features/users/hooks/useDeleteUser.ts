import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUser } from "../../../api/users";

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}
