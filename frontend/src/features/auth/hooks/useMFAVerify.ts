import { useMutation } from "@tanstack/react-query";
import { verifyMFA } from "../../../api/users";
import { useAuth } from "../AuthContext";

export function useMFAVerify() {
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: ({ mfa_token, otp_code }: { mfa_token: string; otp_code: string }) =>
      verifyMFA(mfa_token, otp_code),
    onSuccess: (user) => setUser(user),
  });
}
