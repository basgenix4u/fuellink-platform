import { z } from "zod";
import { FUEL_TYPES, NIGERIAN_STATES } from "../common/constants";

const fuelType = z.enum(FUEL_TYPES);
const stateName = z.enum(NIGERIAN_STATES);

export const createDepotSchema = z.object({
  name: z.string().min(2).max(160),
  state: stateName,
  lga: z.string().max(120).optional(),
  address: z.string().max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  capacityKL: z.number().positive().max(1_000_000).optional(),
  fuelTypes: z.array(fuelType).min(1).max(FUEL_TYPES.length),
  gantryActive: z.boolean().default(false),
  nnpcLicenseNo: z.string().max(80).optional(),
  notes: z.string().max(2000).optional()
});

export const updateDepotSchema = createDepotSchema.partial();

export const listDepotsSchema = z.object({
  state: stateName.optional(),
  fuelType: fuelType.optional(),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50)
});

export type CreateDepotInput = z.infer<typeof createDepotSchema>;
export type UpdateDepotInput = z.infer<typeof updateDepotSchema>;
export type ListDepotsQuery = z.infer<typeof listDepotsSchema>;
