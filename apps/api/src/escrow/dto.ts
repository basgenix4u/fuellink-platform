import { EscrowStatus } from "@prisma/client";
import { z } from "zod";
import { FUEL_TYPES } from "../common/constants";

export const createEscrowSchema = z.object({
  depotId: z.string().cuid("Invalid depot id"),
  fuelType: z.enum(FUEL_TYPES),
  quantityLiters: z
    .number()
    .positive("Quantity must be positive")
    .max(100_000_000, "Quantity looks wrong (max 100M liters)"),
  unitPriceKobo: z
    .number()
    .int("Use whole kobo (naira × 100)")
    .positive("Price must be positive")
    .max(10_000_000, "Price looks wrong (max ₦100,000/liter)")
});

export const transitionEscrowSchema = z.object({
  status: z.nativeEnum(EscrowStatus, {
    errorMap: () => ({ message: `Use one of: ${Object.values(EscrowStatus).join(", ")}` })
  }),
  statusNote: z.string().max(500).optional(),
  // Set by the operator when recording a bank-hold reference from Providus.
  bankRef: z.string().min(3).max(120).optional()
});

export const listEscrowSchema = z.object({
  status: z.nativeEnum(EscrowStatus).optional(),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50)
});

export type CreateEscrowInput = z.infer<typeof createEscrowSchema>;
export type TransitionEscrowInput = z.infer<typeof transitionEscrowSchema>;
export type ListEscrowQuery = z.infer<typeof listEscrowSchema>;
