import { PrismaClient, UserStatus } from "../../generated/prisma/client.js";

export class AuthRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async createUser(params: {
        email: string;
        passwordHash: string;
        name?: string;
    }) {
        return this.prisma.user.create({
            data: {
                name: params.name,
                email: params.email,
                passwordHash: params.passwordHash,
                status: UserStatus.ACTIVE,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });
    }

    async findUserByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: {
                email,
            },
        });
    }

    async markEmailAsVerified(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { isEmailVerified: true },
        });
    }

    async updatePasswordHash(userId: string, passwordHash: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
    }

    async findUserById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isEmailVerified: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
}
