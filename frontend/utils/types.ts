
export interface ActionResult<T = unknown> {
  success: boolean;
  message: string;
  user?: T;
  data?: T;
}

export interface RegisterActionInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginActionInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface VerifyOtpActionInput {
  email: string;
  code: string;
}

export interface ResetPasswordActionInput {
  email: string;
  code: string;
  newPassword: string;
}