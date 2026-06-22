import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../../../api/users";
import { useAuth } from "../AuthContext";

export function useLogout() {
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
    },
  });
}
