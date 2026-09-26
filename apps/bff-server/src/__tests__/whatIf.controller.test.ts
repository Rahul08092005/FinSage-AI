/**
 * Tests for POST /api/v1/goals/what-if (whatIfSimulator handler)
 * ================================================================
 * Mocks the AI engine fetch call — tests controller transport logic.
 *
 * Coverage:
 *   ✓ happy path: valid body → AI engine responds 200 → returns projections
 *   ✓ 400: missing required fields
 *   ✓ 502: AI engine returns non-2xx
 *   ✓ 503: AI engine is unreachable (fetch throws)
 */

import { whatIfSimulator } from "../controllers/goals.controller";
import { AuthedRequest } from "../middleware/auth.middleware";
import { Response } from "express";

// ---- Mock Prisma ----
jest.mock("../lib/prisma", () => ({
  prisma: {
    goal: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: "goal-1",
          title: "Emergency Fund",
          targetAmount: 100000,
          endDate: new Date("2027-01-01"),
        },
      ]),
    },
    transaction: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: "tx-1",
          amount: 5000,
          category: "Food",
          transactionDate: new Date("2026-09-01"),
          description: "Groceries",
        },
      ]),
    },
  },
}));

// ---- Mock fetch ----
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// ---- Helper to build minimal Express req/res mocks ----
function buildReqRes(body: unknown, userId = "user-123") {
  const req = {
    body,
    userId,
  } as AuthedRequest;

  const json = jest.fn();
  const status = jest.fn().mockReturnThis();
  const res = { json, status } as unknown as Response;

  return { req, res, json, status };
}

const validWhatIfBody = {
  incomeDelta: 10000,
  expenseDelta: -2000,
  savingsRateDelta: 5,
};

const validAiResponse = {
  goals: [
    {
      id: "goal-1",
      title: "Emergency Fund",
      originalEta: "2027-01-01",
      revisedEta: "2026-09-15",
      onTrack: true,
      projectedSavings: 12000,
    },
  ],
};

describe("whatIfSimulator controller", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // ---- Happy path ----
  it("returns AI engine projections on happy path", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(validAiResponse),
      text: jest.fn().mockResolvedValue(JSON.stringify(validAiResponse)),
    });

    const { req, res, json } = buildReqRes(validWhatIfBody);
    await whatIfSimulator(req, res);

    expect(json).toHaveBeenCalledWith(validAiResponse);
  });

  // ---- 400: missing fields ----
  it("returns 400 when incomeDelta is missing", async () => {
    const { req, res, status, json } = buildReqRes({ expenseDelta: 0, savingsRateDelta: 2 });
    await whatIfSimulator(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.anything() }));
  });

  it("returns 400 when body is empty", async () => {
    const { req, res, status, json } = buildReqRes({});
    await whatIfSimulator(req, res);

    expect(status).toHaveBeenCalledWith(400);
  });

  // ---- 502: AI engine non-2xx ----
  it("returns 502 when AI engine responds with 500", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ detail: "Internal error" }),
      text: jest.fn().mockResolvedValue("Internal Server Error"),
    });

    const { req, res, status, json } = buildReqRes(validWhatIfBody);
    await whatIfSimulator(req, res);

    expect(status).toHaveBeenCalledWith(502);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "AI engine returned an error" })
    );
  });

  // ---- 503: AI engine unreachable ----
  it("returns 503 when AI engine fetch throws (ECONNREFUSED)", async () => {
    mockFetch.mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:8000"));

    const { req, res, status, json } = buildReqRes(validWhatIfBody);
    await whatIfSimulator(req, res);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "AI engine unreachable" })
    );
  });
});
