import { FuelProduct, OrderStatus } from "@prisma/client";
import { z } from "zod";
import { NIGERIAN_STATES } from "../common/constants";
import { nigerianPhone } from "../auth/dto";

export const createOrderSchema = z.object({
  listingId: z.string().cuid("Select a valid listing"),
  /** Litres, up to 3 decimal places. */
  quantityLitres: z
    .number()
    .positive("Quantity must be greater than zero")
    .max(100_000_000, "Quantity exceeds the maximum permitted volume"),
  deliveryState: z.enum(NIGERIAN_STATES).optional(),
  deliveryLga: z.string().trim().max(120).optional(),
  deliveryAddress: z.string().trim().max(300).optional(),
  expectedLoadingDate: z.coerce.date().optional(),
  /**
   * The price the buyer saw. If the depot has since changed it, the order is
   * rejected rather than silently filled at a different price.
   */
  expectedPricePerLitreKobo: z.string().regex(/^\d+$/).optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().min(3, "Give a brief reason").max(500),
});

export const allocateOrderSchema = z.object({
  /** Loading date the depot commits to. */
  loadingDate: z.coerce.date(),
  note: z.string().trim().max(500).optional(),
});

export const dispatchOrderSchema = z.object({
  truckPlate: z.string().trim().min(3).max(20),
  driverName: z.string().trim().min(2).max(120),
  driverPhone: nigerianPhone,
  haulierName: z.string().trim().max(160).optional(),
  waybillNumber: z.string().trim().max(80).optional(),
  /** Metered volume actually loaded onto the truck. */
  loadedLitres: z.number().positive().max(100_000_000),
});

export const confirmDeliverySchema = z.object({
  /** Volume the buyer measured on receipt. */
  receivedLitres: z.number().positive().max(100_000_000),
  receivedByName: z.string().trim().min(2).max(120),
  notes: z.string().trim().max(1000).optional(),
});

export const listOrdersSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  product: z.nativeEnum(FuelProduct).optional(),
  depotId: z.string().cuid().optional(),
  /** ISO dates bounding createdAt. */
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  search: z.string().trim().max(120).optional(),
  sort: z.enum(["newest", "oldest", "value_desc"]).default("newest"),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const createQuoteRequestSchema = z.object({
  depotId: z.string().cuid(),
  product: z.nativeEnum(FuelProduct),
  quantityLitres: z.number().positive().max(100_000_000),
  deliveryState: z.enum(NIGERIAN_STATES).optional(),
  deliveryAddress: z.string().trim().max(300).optional(),
  neededBy: z.coerce.date().optional(),
  buyerNote: z.string().trim().max(1000).optional(),
});

export const respondToQuoteSchema = z.object({
  pricePerLitreNaira: z.number().positive().max(100_000),
  validUntil: z.coerce.date(),
  depotNote: z.string().trim().max(1000).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type AllocateOrderInput = z.infer<typeof allocateOrderSchema>;
export type DispatchOrderInput = z.infer<typeof dispatchOrderSchema>;
export type ConfirmDeliveryInput = z.infer<typeof confirmDeliverySchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersSchema>;
export type CreateQuoteRequestInput = z.infer<typeof createQuoteRequestSchema>;
export type RespondToQuoteInput = z.infer<typeof respondToQuoteSchema>;
