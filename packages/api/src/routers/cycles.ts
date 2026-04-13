import { z } from "zod";

import { protectedProcedure } from "../index";

// ── Output schema ──────────────────────────────────────────────────────────

const CycleItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  period: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  totalItems: z.number(),
  doneItems: z.number(),
});

// ── Router ─────────────────────────────────────────────────────────────────

export const cyclesRouter = {
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["active", "draft", "completed"]).optional(),
        limit: z.number().min(1).max(100).default(10),
      }),
    )
    .output(z.array(CycleItemSchema))
    .handler(async () => {
      // No cycles table in DB yet — returns empty until schema is created
      return [];
    }),
};
