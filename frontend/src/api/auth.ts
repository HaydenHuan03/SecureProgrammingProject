import client from './clientLogin';

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  password2: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface OTPPayload {
  email: string;
  code: string;
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  role: string;
  date_joined: string;
}

export const authApi = {
  register:   (data: RegisterPayload)  => client.post('/auth/register/', data),
  login:      (data: LoginPayload)     => client.post('/auth/login/', data),
  verifyOTP:  (data: OTPPayload)       => client.post('/auth/otp-verify/', data),
  logout:     ()                       => client.post('/auth/logout/'),
  profile:    ()                       => client.get<UserProfile>('/auth/profile/'),
};