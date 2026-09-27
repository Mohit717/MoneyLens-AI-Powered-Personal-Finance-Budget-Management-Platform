import { PasswordService } from "../../services/password.service.js";
import { AuthRepository } from "./auth.repository.js";
import { LoginInput, RegisterInput } from "./auth.schema.js";
import { AuthSessionService } from "./auth-session.service.js";
import { OtpService } from "../../services/otp.service.js";
import { OtpPurpose } from "../../generated/prisma/client.js";

export const normalizeEmail = (email: string): string => {
    return email.trim().toLowerCase().normalize("NFKC");
};

export class AuthService {
    constructor(private readonly authRepository: AuthRepository) { }

    async register(input: RegisterInput) {
        const email = normalizeEmail(input.email);

        const existingUser = await this.authRepository.findUserByEmail(email);
        if (existingUser) {
            throw new Error("EMAIL_ALREADY_EXISTS");
        }

        const passwordHash = await PasswordService.hashPassword(input.password);

        const user = await this.authRepository.createUser({
            email,
            passwordHash,
        });

        // Automatically dispatch Email Verification OTP on registration
        await OtpService.generateAndSendOtp(email, OtpPurpose.EMAIL_VERIFICATION);

        return user;
    }

    async login(input: LoginInput) {
        const email = normalizeEmail(input.email);
        const user = await this.authRepository.findUserByEmail(email);
        if (!user) {
            throw new Error("INVALID_CREDENTIALS");
        }

        const isPasswordValid = await PasswordService.verifyPassword(
            user.passwordHash,
            input.password
        );

        if (!isPasswordValid) {
            throw new Error("INVALID_CREDENTIALS");
        }

        const session = await AuthSessionService.createSession({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt,
            },
            ...session,
        };
    }

    async sendEmailOtp(rawEmail: string) {
        const email = normalizeEmail(rawEmail);
        const user = await this.authRepository.findUserByEmail(email);

        if (!user) {
            throw new Error('USER_NOT_FOUND')
        }

        if (user.isEmailVerified) {
            throw new Error('EMAIL_ALREADY_VERIFIED')
        }

        await OtpService.generateAndSendOtp(email, OtpPurpose.EMAIL_VERIFICATION);
        return { email };
    }

    async verifyEmail(rawEmail: string, code: string) {
        const email = normalizeEmail(rawEmail);
        const user = await this.authRepository.findUserByEmail(email);

        if (!user) {
            throw new Error('USER_NOT_FOUND')
        }

        await OtpService.verifyOtp(email, code, OtpPurpose.EMAIL_VERIFICATION);
        await this.authRepository.markEmailAsVerified(user.id);

        return { email };
    }

    async forgotPassword(rawEmail: string) {
        const email = normalizeEmail(rawEmail);
        const user = await this.authRepository.findUserByEmail(email);

        if (!user) {
            // For security, return success message without revealing user presence
            return { email };
        }

        await OtpService.generateAndSendOtp(email, OtpPurpose.PASSWORD_RESET);
        return { email };
    }

    async resetPassword(rawEmail: string, code: string, newPassword: string) {
        const email = normalizeEmail(rawEmail);
        const user = await this.authRepository.findUserByEmail(email);

        if (!user) {
            throw new Error('USER_NOT_FOUND')
        }

        await OtpService.verifyOtp(email, code, OtpPurpose.PASSWORD_RESET);

        const passwordHash = await PasswordService.hashPassword(newPassword);
        await this.authRepository.updatePasswordHash(user.id, passwordHash);

        return { email };
    }

    async getProfile(userId: string) {
        const user = await this.authRepository.findUserById(userId);
        if (!user) {
            throw new Error('USER_NOT_FOUND')
        }
        return user;
    }
}