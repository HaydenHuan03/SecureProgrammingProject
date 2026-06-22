import { useMutation } from "@tanstack/react-query";
import { sendOTP } from "../../../api/users";

export function useSendOTP() {
  return useMutation({
    mutationFn: ({ mfa_token, email }: { mfa_token: string; email: string }) =>
      sendOTP(mfa_token, email),
  });
}
