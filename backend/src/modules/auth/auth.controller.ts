import { NextFunction, Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  sendOtpSchema,
  verifyEmailSchema,
} from "./auth.schema.js";
import { AuditLogger } from "../../services/logger.service.js";
import { ResponseHandler } from "../../middlewares/responseHandler.js";
import { AuthSessionService } from "./auth-session.service.js";

export class AuthController {
  constructor(private readonly authService: AuthService) { }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = registerSchema.parse(req.body);

      const user = await this.authService.register(input);

      await AuditLogger.log({
        level: "info",
        action: "AUTH_REGISTER_SUCCESS",
        message: `User registered successfully & verification OTP sent: ${user.email}`,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return ResponseHandler.created(
        res,
        "User registered successfully. A verification OTP has been sent to your email address.",
        { user }
      );
    } catch (error: any) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = loginSchema.parse(req.body);
      const { user, accessToken, refreshToken } = await this.authService.login(input);

      // Set Refresh Token in HttpOnly, Secure, SameSite=Strict Cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      await AuditLogger.log({
        action: "AUTH_LOGIN_SUCCESS",
        message: `User logged in: ${user.email}`,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return ResponseHandler.success({
        res,
        message: "Login successful",
        data: { user, accessToken },
      });
    } catch (error) {
      next(error);
    }
  };

  sendEmailOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = sendOtpSchema.parse(req.body);
      await this.authService.sendEmailOtp(input.email);

      await AuditLogger.log({
        action: "OTP_SENT_EMAIL_VERIFICATION",
        message: `Email verification OTP sent to ${input.email}`,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return ResponseHandler.success({
        res,
        message: "Verification OTP has been sent to your email address.",
      });
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = verifyEmailSchema.parse(req.body);
      await this.authService.verifyEmail(input.email, input.code);

      await AuditLogger.log({
        action: "EMAIL_VERIFIED_SUCCESS",
        message: `Email verified successfully for ${input.email}`,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return ResponseHandler.success({
        res,
        message: "Email address verified successfully.",
      });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = sendOtpSchema.parse(req.body);
      await this.authService.forgotPassword(input.email);

      await AuditLogger.log({
        action: "OTP_SENT_PASSWORD_RESET",
        message: `Password reset OTP sent to ${input.email}`,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return ResponseHandler.success({
        res,
        message: "If an account exists with this email, a password reset OTP has been sent.",
      });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = resetPasswordSchema.parse(req.body);
      await this.authService.resetPassword(input.email, input.code, input.newPassword);

      await AuditLogger.log({
        action: "PASSWORD_RESET_SUCCESS",
        message: `Password reset successfully for ${input.email}`,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return ResponseHandler.success({
        res,
        message: "Password has been reset successfully. Please log in with your new password.",
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        throw new Error('UNAUTHORIZED')
      }

      const { accessToken, refreshToken: newRefreshToken } =
        await AuthSessionService.rotateSession(refreshToken);

      // Set NEW Refresh Token Cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return ResponseHandler.success({
        res,
        message: 'Token rotated successfully',
        data: { accessToken },
      });
    } catch (error) {
      res.clearCookie('refreshToken');
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        await AuthSessionService.revokeSession(refreshToken);
      }

      res.clearCookie('refreshToken');

      await AuditLogger.log({
        action: 'AUTH_LOGOUT_SUCCESS',
        message: 'User logged out successfully',
        userId: (req as any).user?.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return ResponseHandler.success({
        res,
        message: 'Logged out successfully.',
      });
    } catch (error) {
      res.clearCookie('refreshToken');
      next(error);
    }
  };

  getMe = async (req: any, res: Response, next: NextFunction) => {
    try {
      const user = await this.authService.getProfile(req.user.id);
      return ResponseHandler.success({
        res,
        message: 'User profile fetched successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };
}
