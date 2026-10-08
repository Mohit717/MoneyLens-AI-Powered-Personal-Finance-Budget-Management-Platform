import { PrismaClient, Account, Prisma } from "../../generated/prisma/client.js";
import { CreateAccountInput, UpdateAccountInput } from "./account.schema.js";

export class AccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(userId: string, includeInactive = false): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: {
        userId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async findById(id: string, userId: string): Promise<Account | null> {
    return this.prisma.account.findFirst({
      where: { id, userId },
      include: {
        transactions: {
          take: 10,
          orderBy: { date: "desc" },
        },
      },
    });
  }

  async create(userId: string, data: CreateAccountInput): Promise<Account> {
    return this.prisma.account.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        balance: new Prisma.Decimal(data.balance),
        currency: data.currency.toUpperCase(),
        accountNumber: data.accountNumber || null,
        institution: data.institution || null,
      },
    });
  }

  async update(id: string, userId: string, data: UpdateAccountInput): Promise<Account> {
    return this.prisma.account.update({
      where: { id, userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.accountNumber !== undefined && { accountNumber: data.accountNumber }),
        ...(data.institution !== undefined && { institution: data.institution }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async countTransactions(accountId: string): Promise<number> {
    return this.prisma.transaction.count({
      where: {
        OR: [{ accountId }, { destinationAccountId: accountId }],
      },
    });
  }

  async delete(id: string, userId: string): Promise<Account> {
    return this.prisma.account.delete({
      where: { id, userId },
    });
  }

  async softDelete(id: string, userId: string): Promise<Account> {
    return this.prisma.account.update({
      where: { id, userId },
      data: { isActive: false },
    });
  }
}

