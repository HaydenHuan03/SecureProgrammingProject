import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser, type Role } from "../../../api/users";

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: { username?: string; email?: string; password?: string; role?: Role };
    }) => updateUser(userId, data),
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", userId] });
    },
  });
}
