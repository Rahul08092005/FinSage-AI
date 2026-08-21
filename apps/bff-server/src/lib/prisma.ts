// Single shared Prisma client instance for the whole BFF.
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
