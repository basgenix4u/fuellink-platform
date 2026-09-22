import { FuelProduct } from "@prisma/client";
import { z } from "zod";
import { NIGERIAN_STATES } from "../common/constants";
import { nigerianPhone } from "../auth/dto";

const litres = z
  .number()
  .positive("Must be greater than zero")
  .max(100_000_000, "Exceeds the maximum permitted volume")
  .refine((v) => Number.isFinite(v), "Must be a finite number");

/** Naira per litre, accepted as naira and converted to kobo server-side. */
const nairaPerLitre = z
  .number()
  .positive("Price must be greater than zero")
  .max(100_000, "Price exceeds the maximum permitted value");

export const createDepotSchema = z.object({
  name: z.string().trim().min(2).max(160),
  state: z.enum(NIGERIAN_STATES),
  lga: z.string().trim().max(120).optional(),
  address: z.string().trim().max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  capacityLitres: litres.optional(),
  gantryActive: z.boolean().default(false),
  dailyLoadingCapacity: z.number().int().positive().max(1000).optional(),
  operatingHours: z.string().trim().max(120).optional(),
  contactPhone: nigerianPhone.optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const updateDepotSchema = createDepotSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Provide at least one field to update");

export const listDepotsSchema = z.object({
  state: z.enum(NIGERIAN_STATES).optional(),
  product: z.nativeEnum(FuelProduct).optional(),
  /** Only depots with active, in-window listings. */
  hasStock: z.coerce.boolean().optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const createTankSchema = z.object({
  name: z.string().trim().min(1).max(80),
  product: z.nativeEnum(FuelProduct),
  capacityLitres: litres,
  currentLitres: z.number().min(0).max(100_000_000).default(0),
});

export const updateTankLevelSchema = z.object({
  currentLitres: z.number().min(0).max(100_000_000),
  /** Physical dip readings are the source of truth for stock. */
  dipAt: z.coerce.date().optional(),
});

export const createListingSchema = z.object({
  depotId: z.string().cuid(),
  product: z.nativeEnum(FuelProduct),
  pricePerLitreNaira: nairaPerLitre,
  availableLitres: litres,
  minOrderLitres: z.number().min(0).max(100_000_000).default(0),
  maxOrderLitres: litres.optional(),
  /**
   * Depot prices move intraday; a listing must state how long it stands.
   * Defaults to 24 hours, capped at 30 days.
   */
  validUntil: z.coerce.date().optional(),
});

export const updateListingSchema = z
  .object({
    pricePerLitreNaira: nairaPerLitre,
    availableLitres: z.number().min(0).max(100_000_000),
    minOrderLitres: z.number().min(0).max(100_000_000),
    maxOrderLitres: litres.nullable(),
    validUntil: z.coerce.date(),
    isActive: z.boolean(),
    /** Optimistic-lock token from the read. Rejected if stale. */
    version: z.number().int().min(0),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Provide at least one field to update");

export const listListingsSchema = z.object({
  product: z.nativeEnum(FuelProduct).optional(),
  state: z.enum(NIGERIAN_STATES).optional(),
  depotId: z.string().cuid().optional(),
  /** Hide expired/inactive listings by default — stale prices cause disputes. */
  includeExpired: z.coerce.boolean().default(false),
  minLitres: z.coerce.number().positive().optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "volume_desc"]).default("price_asc"),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type CreateDepotInput = z.infer<typeof createDepotSchema>;
export type UpdateDepotInput = z.infer<typeof updateDepotSchema>;
export type ListDepotsQuery = z.infer<typeof listDepotsSchema>;
export type CreateTankInput = z.infer<typeof createTankSchema>;
export type UpdateTankLevelInput = z.infer<typeof updateTankLevelSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListListingsQuery = z.infer<typeof listListingsSchema>;
