/**
 * Nigerian states (36) + Abuja (FCT), used for depot location validation.
 */
export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  // Federal Capital Territory
  "Abuja"
] as const;

export type NigerianState = (typeof NIGERIAN_STATES)[number];

/**
 * Downstream products traded on FuelLink — aligned with NMDPRA fact-sheet
 * product codes (PMS = petrol, AGO = automotive gas oil, ATK = aviation
 * turbine kerosene, LPG).
 */
export const FUEL_TYPES = ["PMS", "AGO", "ATK", "LPG"] as const;

export type FuelType = (typeof FUEL_TYPES)[number];
