import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import budgetsRoutes from "./routes/budgets.routes";
import expensesRoutes from "./routes/expenses.routes";
import goalsRoutes from "./routes/goals.routes";
import healthRoutes from "./routes/health.routes";
import transactionsRoutes from "./routes/transactions.routes";
import usersRoutes from "./routes/users.routes";
// Phase 3 routes
import documentsRoutes from "./routes/documents.routes";
import advisorRoutes from "./routes/advisor.routes";
import knowledgeRoutes from "./routes/knowledge.routes";
import analyticsRoutes from "./routes/analytics.routes";
// Phase 4 routes
import reportsRoutes from "./routes/reports.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
// helmet sets ~15 security-related HTTP headers (XSS, clickjacking, MIME sniffing, etc.)
app.use(helmet());
app.use(express.json());

// Phase 1 / 2
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/transactions", transactionsRoutes);
app.use("/api/v1/expenses", expensesRoutes);
app.use("/api/v1/budgets", budgetsRoutes);
app.use("/api/v1/goals", goalsRoutes);

// Phase 3
app.use("/api/v1/documents", documentsRoutes);
app.use("/api/v1/advisor", advisorRoutes);
app.use("/api/v1/knowledge", knowledgeRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
// Phase 4
app.use("/api/v1/reports", reportsRoutes);

app.listen(PORT, () => {
  console.log(`[bff-server] listening on http://localhost:${PORT}`);
});

