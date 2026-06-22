import { useQuery } from "@tanstack/react-query";
import { getUser } from "../../../api/users";

export function useUser(userId: string) {
  return useQuery({ queryKey: ["users", userId], queryFn: () => getUser(userId) });
}
