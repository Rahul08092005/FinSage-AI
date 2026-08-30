import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import authRoutes from "./routes/auth.routes";
import budgetsRoutes from "./routes/budgets.routes";
import expensesRoutes from "./routes/expenses.routes";
import goalsRoutes from "./routes/goals.routes";
import healthRoutes from "./routes/health.routes";
import transactionsRoutes from "./routes/transactions.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/transactions", transactionsRoutes);
app.use("/api/v1/expenses", expensesRoutes);
app.use("/api/v1/budgets", budgetsRoutes);
app.use("/api/v1/goals", goalsRoutes);

app.listen(PORT, () => {
  console.log(`[bff-server] listening on http://localhost:${PORT}`);
});
