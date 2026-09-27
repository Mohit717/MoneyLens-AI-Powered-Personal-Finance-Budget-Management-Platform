import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { AuthRepository } from "./auth.repository.js";
import { prisma } from "../../lib/prisma.js";
import { authRateLimiter } from "../../middlewares/rateLimiter.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
export const authRouter = Router();

const authRepository = new AuthRepository(prisma);
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

authRouter.post('/login', authRateLimiter, authController.login);
authRouter.post('/register', authRateLimiter, authController.register);
// Email Verification
authRouter.post('/otp/send-verification', authController.sendEmailOtp);
authRouter.post('/otp/verify-email', authController.verifyEmail);

// Password Reset
authRouter.post('/otp/forgot-password', authController.forgotPassword);
authRouter.post('/otp/reset-password', authController.resetPassword);

// Refresh & Logout
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
// Protected Profile Endpoint
authRouter.get('/me', authenticate, authController.getMe);