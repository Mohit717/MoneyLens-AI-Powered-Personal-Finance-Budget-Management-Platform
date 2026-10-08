import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";
import { TokenService } from "../../src/services/token.service.js";

describe("Milestone 1: Expense Ledger, Budgets & Multi-Account Engine (Integration)", () => {
  let userAId: string;
  let userBId: string;
  let tokenA: string;
  let tokenB: string;

  const userAEmail = `ledger_user_a_${Date.now()}@example.com`;
  const userBEmail = `ledger_user_b_${Date.now()}@example.com`;

  let hdfcAccountId: string;
  let cashAccountId: string;
  let foodCategoryId: string;
  let customCategoryId: string;
  let expenseTxId: string;
  const currentPeriod = new Date().toISOString().slice(0, 7);

  beforeAll(async () => {
    // 1. Create two test users for isolation testing
    const userA = await prisma.user.create({
      data: {
        email: userAEmail,
        passwordHash: "dummyHashForTesting123",
        name: "Ledger User A",
        isEmailVerified: true,
      },
    });
    userAId = userA.id;

    const userB = await prisma.user.create({
      data: {
        email: userBEmail,
        passwordHash: "dummyHashForTesting456",
        name: "Ledger User B",
        isEmailVerified: true,
      },
    });
    userBId = userB.id;

    // 2. Generate access tokens for both users
    tokenA = await TokenService.generateAccessToken({
      userId: userAId,
      email: userAEmail,
      role: "USER",
    });

    tokenB = await TokenService.generateAccessToken({
      userId: userBId,
      email: userBEmail,
      role: "USER",
    });
  });

  afterAll(async () => {
    // Cleanup User A & User B data
    await prisma.transaction.deleteMany({
      where: { userId: { in: [userAId, userBId] } },
    });
    await prisma.budget.deleteMany({
      where: { userId: { in: [userAId, userBId] } },
    });
    await prisma.account.deleteMany({
      where: { userId: { in: [userAId, userBId] } },
    });
    await prisma.category.deleteMany({
      where: { userId: { in: [userAId, userBId] } },
    });
    await prisma.auditLog.deleteMany({
      where: { userId: { in: [userAId, userBId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userAId, userBId] } },
    });
  });

  describe("1. Category Management & System Presets", () => {
    it("should fetch system preset categories and initialize database presets", async () => {
      const res = await request(app)
        .get("/api/v1/categories")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.categories.length).toBeGreaterThan(0);

      const foodCategory = res.body.data.categories.find(
        (c: any) => c.name === "Food & Dining"
      );
      expect(foodCategory).toBeDefined();
      expect(foodCategory.isPreset).toBe(true);
      expect(foodCategory.type).toBe("EXPENSE");
      foodCategoryId = foodCategory.id;
    });

    it("should allow user to create custom subcategory under a preset", async () => {
      const res = await request(app)
        .post("/api/v1/categories")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          name: "Organic Farmer Market",
          type: "EXPENSE",
          parentId: foodCategoryId,
          icon: "Leaf",
          color: "#10B981",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category.name).toBe("Organic Farmer Market");
      expect(res.body.data.category.isPreset).toBe(false);
      customCategoryId = res.body.data.category.id;
    });

    it("should reject modifying system preset categories (400 Bad Request)", async () => {
      const res = await request(app)
        .put(`/api/v1/categories/${foodCategoryId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ name: "Hacked Food Name" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("CANNOT_MODIFY_PRESET");
    });
  });

  describe("2. Accounts Engine & Balance Aggregation", () => {
    it("should create bank and cash accounts with initial balances", async () => {
      // 1. Create HDFC Bank Account (Initial Balance: 100,000)
      const res1 = await request(app)
        .post("/api/v1/accounts")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          name: "HDFC Salary Account",
          type: "BANK",
          balance: 100000,
          currency: "INR",
          institution: "HDFC Bank",
          accountNumber: "9876",
        });

      expect(res1.status).toBe(201);
      expect(res1.body.data.account.balance).toBe(100000);
      hdfcAccountId = res1.body.data.account.id;

      // 2. Create Cash Wallet Account (Initial Balance: 5,000)
      const res2 = await request(app)
        .post("/api/v1/accounts")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          name: "Cash Wallet",
          type: "CASH",
          balance: 5000,
          currency: "INR",
        });

      expect(res2.status).toBe(201);
      expect(res2.body.data.account.balance).toBe(5000);
      cashAccountId = res2.body.data.account.id;
    });

    it("should list accounts with net worth and liquid balance calculations", async () => {
      const res = await request(app)
        .get("/api/v1/accounts")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.accounts.length).toBe(2);
      expect(res.body.data.summary.liquidBalance).toBe(105000);
      expect(res.body.data.summary.totalBalance).toBe(105000);
    });
  });

  describe("3. Transactions & Atomic Double-Entry Ledger Reconciliation", () => {
    it("should record an EXPENSE transaction and decrement account balance atomically", async () => {
      const res = await request(app)
        .post("/api/v1/transactions")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          accountId: hdfcAccountId,
          categoryId: foodCategoryId,
          amount: 2500,
          type: "EXPENSE",
          payee: "Nature's Basket",
          description: "Weekly organic veggies",
          tags: ["groceries", "home"],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.transaction.amount).toBe(2500);
      expenseTxId = res.body.data.transaction.id;

      // Verify account balance was atomically decremented from 100,000 to 97,500
      const accountRes = await request(app)
        .get(`/api/v1/accounts/${hdfcAccountId}`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(accountRes.body.data.account.balance).toBe(97500);
    });

    it("should record an INCOME transaction and increment account balance atomically", async () => {
      const res = await request(app)
        .post("/api/v1/transactions")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          accountId: hdfcAccountId,
          amount: 15000,
          type: "INCOME",
          payee: "Consulting Client",
          description: "Freelance gig payout",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.transaction.type).toBe("INCOME");

      // Verify balance increased from 97,500 to 112,500
      const accountRes = await request(app)
        .get(`/api/v1/accounts/${hdfcAccountId}`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(accountRes.body.data.account.balance).toBe(112500);
    });

    it("should record an internal TRANSFER atomically decrementing source and incrementing destination", async () => {
      const res = await request(app)
        .post("/api/v1/transactions")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          accountId: hdfcAccountId,
          destinationAccountId: cashAccountId,
          amount: 5000,
          type: "TRANSFER",
          description: "ATM Cash Withdrawal",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.transaction.type).toBe("TRANSFER");

      // Source (HDFC) 112,500 - 5,000 = 107,500
      const hdfcRes = await request(app)
        .get(`/api/v1/accounts/${hdfcAccountId}`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(hdfcRes.body.data.account.balance).toBe(107500);

      // Destination (Cash) 5,000 + 5,000 = 10,000
      const cashRes = await request(app)
        .get(`/api/v1/accounts/${cashAccountId}`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(cashRes.body.data.account.balance).toBe(10000);
    });

    it("should edit a transaction and reconcile account balance with the delta", async () => {
      // Original expense was 2500. Update it to 3500 (an increase of 1000 in spend)
      const res = await request(app)
        .put(`/api/v1/transactions/${expenseTxId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          amount: 3500,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.transaction.amount).toBe(3500);

      // HDFC balance was 107,500. With 1,000 additional expense, it must be 106,500
      const hdfcRes = await request(app)
        .get(`/api/v1/accounts/${hdfcAccountId}`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(hdfcRes.body.data.account.balance).toBe(106500);
    });

    it("should delete a transaction and restore account balance (ledger reconciliation)", async () => {
      const res = await request(app)
        .delete(`/api/v1/transactions/${expenseTxId}`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);

      // Deleting the 3500 expense must restore HDFC balance from 106,500 to 110,000
      const hdfcRes = await request(app)
        .get(`/api/v1/accounts/${hdfcAccountId}`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(hdfcRes.body.data.account.balance).toBe(110000);
    });

    it("should filter paginated transactions by type and compute cash flow summary", async () => {
      const res = await request(app)
        .get("/api/v1/transactions")
        .set("Authorization", `Bearer ${tokenA}`)
        .query({ limit: 10, page: 1 });

      expect(res.status).toBe(200);
      expect(res.body.data.transactions).toBeDefined();
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(2);
      expect(res.body.data.summary.totalIncome).toBe(15000);
    });
  });

  describe("4. Budgets Engine & Monthly Spending Thresholds", () => {
    it("should set monthly budget threshold for Food & Dining category", async () => {
      const res = await request(app)
        .post("/api/v1/budgets")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          categoryId: foodCategoryId,
          monthlyLimit: 10000,
          period: currentPeriod,
          rolloverEnabled: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.budget.monthlyLimit).toBe(10000);
      expect(res.body.data.budget.period).toBe(currentPeriod);
    });

    it("should return budget progress comparing monthly limit vs actual spent", async () => {
      // 1. Add an expense of 8000 for Food in this period
      await request(app)
        .post("/api/v1/transactions")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          accountId: hdfcAccountId,
          categoryId: foodCategoryId,
          amount: 8000,
          type: "EXPENSE",
          payee: "Supermarket",
        });

      // 2. Query budget summary
      const summaryRes = await request(app)
        .get("/api/v1/budgets/summary")
        .set("Authorization", `Bearer ${tokenA}`)
        .query({ period: currentPeriod });

      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.data.categories.length).toBeGreaterThan(0);

      const foodProgress = summaryRes.body.data.categories.find(
        (c: any) => c.categoryId === foodCategoryId
      );
      expect(foodProgress).toBeDefined();
      expect(foodProgress.monthlyLimit).toBe(10000);
      expect(foodProgress.actualSpent).toBe(8000);
      expect(foodProgress.remaining).toBe(2000);
      expect(foodProgress.percentageUsed).toBe(80);
      expect(foodProgress.status).toBe("WARNING"); // Between 75% and 99.99%

      expect(summaryRes.body.data.summary.totalBudgeted).toBe(10000);
      expect(summaryRes.body.data.summary.totalSpentInBudgets).toBe(8000);
    });
  });

  describe("5. Multi-Tenant Security & Access Control Enforcement", () => {
    it("should prevent User B from reading User A's accounts (404 Not Found)", async () => {
      const res = await request(app)
        .get(`/api/v1/accounts/${hdfcAccountId}`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("should prevent User B from updating or tampering with User A's accounts", async () => {
      const res = await request(app)
        .put(`/api/v1/accounts/${hdfcAccountId}`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ name: "User B Hijack Attempt" });

      expect(res.status).toBe(404);
    });

    it("should reject requests without authorization token (401 Unauthorized)", async () => {
      const res = await request(app).get("/api/v1/budgets/summary");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

