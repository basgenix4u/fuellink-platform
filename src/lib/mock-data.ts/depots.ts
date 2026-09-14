// src/lib/mock-data/depots.ts
// UPDATED: Added logoUrl (fuel tank SVG per depot), googleMapsUrl, coordinates, chat language preference
// REMOVED: public pricePerLitre — prices are now private, only via chat

export interface DepotProduct {
  id: string;
  type: string;
  name: string;
  stockLevel: "high" | "medium" | "low" | "out_of_stock";
  stockLitres: number;
  // NO pricePerLitre — prices are private, revealed only via AI chat
  specifications: {
    color: string;
    colorCode: string;
    density: number;
    source: string;
    testDate: string;
    sulfurContent?: string;
    flashPoint?: string;
    octaneRating?: string;
  };
  updatedAt: string;
}

export interface MockDepot {
  id: string;
  name: string;
  slug: string;
  address: string;
  state: string;
  lga: string;
  coordinates: { lat: number; lng: number };
  googleMapsUrl: string; // real Google Maps link for the depot
  phone: string;
  email: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  operatingHours: string;
  description: string;
  logoColor: string; // brand color for avatar
  logoInitials: string; // 1-2 letters for the logo circle
  products: DepotProduct[];
  stats: {
    totalOrders: number;
    completedOrders: number;
    averageLoadingTime: string;
    onTimeRate: number;
  };
  preferredChatLanguage: "en" | "ha" | "yo" | "ig" | "pcm"; // AI default language
  createdAt: string;
}

export const mockDepots: MockDepot[] = [
  {
    id: "depot-001",
    name: "Pinnacle Oil & Gas Terminal",
    slug: "pinnacle-oil-gas-terminal",
    address: "Plot 15, Apapa Tank Farm Complex, Apapa",
    state: "Lagos",
    lga: "Apapa",
    coordinates: { lat: 6.4474, lng: 3.3903 },
    googleMapsUrl:
      "https://www.google.com/maps/place/Apapa+Tank+Farm/@6.4474,3.3903,15z",
    phone: "+234 801 234 5678",
    email: "operations@pinnacleoil.com",
    rating: 4.8,
    reviewCount: 342,
    isVerified: true,
    operatingHours: "24/7",
    description:
      "Pinnacle Oil & Gas Terminal is one of Lagos' premier petroleum storage and distribution facilities. We offer competitive pricing, fast loading times, and excellent customer service. Our 24/7 operations ensure you can always access products when you need them.",
    logoColor: "#1e5c2e",
    logoInitials: "PO",
    preferredChatLanguage: "en",
    products: [
      {
        id: "prod-001",
        type: "AGO",
        name: "Automotive Gas Oil (Diesel)",
        stockLevel: "high",
        stockLitres: 5200000,
        specifications: {
          color: "clear-straw",
          colorCode: "#F4E04D",
          density: 845,
          source: "Dangote Refinery",
          testDate: "2025-02-19",
          sulfurContent: "7 ppm",
          flashPoint: "68°C",
        },
        updatedAt: "2025-02-19T09:00:00Z",
      },
      {
        id: "prod-002",
        type: "PMS",
        name: "Premium Motor Spirit (Petrol)",
        stockLevel: "high",
        stockLitres: 3200000,
        specifications: {
          color: "clear",
          colorCode: "#FAFAFA",
          density: 718,
          source: "Dangote Refinery",
          testDate: "2025-02-19",
          octaneRating: "92 RON",
        },
        updatedAt: "2025-02-19T08:30:00Z",
      },
      {
        id: "prod-003",
        type: "DPK",
        name: "Dual Purpose Kerosene",
        stockLevel: "medium",
        stockLitres: 800000,
        specifications: {
          color: "clear",
          colorCode: "#F9FAFB",
          density: 795,
          source: "NNPCL PHC",
          testDate: "2025-02-18",
          flashPoint: "42°C",
        },
        updatedAt: "2025-02-18T16:00:00Z",
      },
    ],
    stats: {
      totalOrders: 2156,
      completedOrders: 2089,
      averageLoadingTime: "35 mins",
      onTimeRate: 96.8,
    },
    createdAt: "2023-06-15T10:00:00Z",
  },
  {
    id: "depot-002",
    name: "Matrix Energy Depot",
    slug: "matrix-energy-depot",
    address: "Marine Road, Apapa, Lagos",
    state: "Lagos",
    lga: "Apapa",
    coordinates: { lat: 6.4489, lng: 3.3856 },
    googleMapsUrl:
      "https://www.google.com/maps/place/Matrix+Energy+Group/@6.4489,3.3856,15z",
    phone: "+234 802 345 6789",
    email: "depot@matrixenergy.ng",
    rating: 4.6,
    reviewCount: 287,
    isVerified: true,
    operatingHours: "06:00 – 22:00",
    description:
      "Matrix Energy Depot is a leading petroleum distribution company serving Lagos and the Southwest. Known for quality products and transparent operations.",
    logoColor: "#b45309",
    logoInitials: "ME",
    preferredChatLanguage: "en",
    products: [
      {
        id: "prod-004",
        type: "AGO",
        name: "Automotive Gas Oil (Diesel)",
        stockLevel: "high",
        stockLitres: 2200000,
        specifications: {
          color: "clear-straw",
          colorCode: "#F4E04D",
          density: 842,
          source: "Dangote Refinery",
          testDate: "2025-02-18",
          sulfurContent: "12 ppm",
          flashPoint: "65°C",
        },
        updatedAt: "2025-02-19T07:45:00Z",
      },
      {
        id: "prod-005",
        type: "PMS",
        name: "Premium Motor Spirit (Petrol)",
        stockLevel: "medium",
        stockLitres: 1500000,
        specifications: {
          color: "clear",
          colorCode: "#FAFAFA",
          density: 720,
          source: "Dangote Refinery",
          testDate: "2025-02-18",
          octaneRating: "91 RON",
        },
        updatedAt: "2025-02-19T07:00:00Z",
      },
    ],
    stats: {
      totalOrders: 1843,
      completedOrders: 1790,
      averageLoadingTime: "42 mins",
      onTimeRate: 94.2,
    },
    createdAt: "2023-08-20T10:00:00Z",
  },
  {
    id: "depot-003",
    name: "TMDK Terminal",
    slug: "tmdk-terminal",
    address: "1 Pioneer Drive, Ijegun Egba Satellite Town, Ijegun",
    state: "Lagos",
    lga: "Ijegun",
    coordinates: { lat: 6.4297, lng: 3.2655 },
    // Real Google Maps link from the screenshot shared
    googleMapsUrl:
      "https://www.google.com/maps/place/TMDK+TERMINAL/@6.4298926,3.2653049,111m/data=!3m1!1e3!4m6!3m5!1s0x103b8902d4fd8b4f:0x3d87a137ca26af84!8m2!3d6.4296191!4d3.2655488!16s%2Fg%2F11sdnzd_w7!5m2!1e4!1e1?entry=ttu&g_ep=EgoyMDI2MDQwOC4wIKXMDSoASAFQAw%3D%3D",
    phone: "0803 210 9849",
    email: "info@tmdkgroup.com",
    rating: 3.6,
    reviewCount: 5,
    isVerified: true,
    operatingHours: "24 hours",
    description:
      "TMDK Terminal is an oil and natural gas storage facility located in Ijegun, Lagos. Specializing in bulk petroleum product storage and distribution for Lagos and neighboring states.",
    logoColor: "#1d4ed8",
    logoInitials: "TK",
    preferredChatLanguage: "en",
    products: [
      {
        id: "prod-008",
        type: "AGO",
        name: "Automotive Gas Oil (Diesel)",
        stockLevel: "high",
        stockLitres: 4200000,
        specifications: {
          color: "clear-straw",
          colorCode: "#F4E04D",
          density: 844,
          source: "Dangote Refinery",
          testDate: "2025-02-19",
          sulfurContent: "8 ppm",
          flashPoint: "68°C",
        },
        updatedAt: "2025-02-19T09:00:00Z",
      },
      {
        id: "prod-009",
        type: "PMS",
        name: "Premium Motor Spirit (Petrol)",
        stockLevel: "high",
        stockLitres: 3100000,
        specifications: {
          color: "clear",
          colorCode: "#FAFAFA",
          density: 718,
          source: "Dangote Refinery",
          testDate: "2025-02-19",
          octaneRating: "92 RON",
        },
        updatedAt: "2025-02-19T09:00:00Z",
      },
    ],
    stats: {
      totalOrders: 412,
      completedOrders: 399,
      averageLoadingTime: "40 mins",
      onTimeRate: 92.5,
    },
    createdAt: "2024-01-10T10:00:00Z",
  },
  {
    id: "depot-004",
    name: "Forte Oil Terminal, Port Harcourt",
    slug: "forte-oil-terminal-ph",
    address: "Trans Amadi Industrial Layout, Port Harcourt",
    state: "Rivers",
    lga: "Obio-Akpor",
    coordinates: { lat: 4.8156, lng: 7.0498 },
    googleMapsUrl:
      "https://www.google.com/maps/search/petroleum+depot+Trans+Amadi+Port+Harcourt/@4.8156,7.0498,14z",
    phone: "+234 803 456 7890",
    email: "ph@forteoil.ng",
    rating: 4.4,
    reviewCount: 198,
    isVerified: true,
    operatingHours: "06:00 – 20:00",
    description:
      "Forte Oil Terminal PH serves the South-South region with high-quality petroleum products sourced directly from Port Harcourt refineries and Dangote.",
    logoColor: "#7c2d12",
    logoInitials: "FO",
    preferredChatLanguage: "en",
    products: [
      {
        id: "prod-010",
        type: "PMS",
        name: "Premium Motor Spirit (Petrol)",
        stockLevel: "high",
        stockLitres: 2800000,
        specifications: {
          color: "clear",
          colorCode: "#FAFAFA",
          density: 718,
          source: "NNPCL PHC",
          testDate: "2025-02-18",
          octaneRating: "91 RON",
        },
        updatedAt: "2025-02-19T07:00:00Z",
      },
      {
        id: "prod-011",
        type: "DPK",
        name: "Dual Purpose Kerosene",
        stockLevel: "high",
        stockLitres: 1200000,
        specifications: {
          color: "clear",
          colorCode: "#F9FAFB",
          density: 795,
          source: "NNPCL PHC",
          testDate: "2025-02-18",
          flashPoint: "42°C",
        },
        updatedAt: "2025-02-18T16:00:00Z",
      },
    ],
    stats: {
      totalOrders: 987,
      completedOrders: 961,
      averageLoadingTime: "38 mins",
      onTimeRate: 95.1,
    },
    createdAt: "2023-11-01T10:00:00Z",
  },
];

// Helper: search depots
export function searchDepots(query: string): MockDepot[] {
  const q = query.toLowerCase();
  return mockDepots.filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.address.toLowerCase().includes(q) ||
      d.state.toLowerCase().includes(q) ||
      d.products.some((p) => p.type.toLowerCase().includes(q))
  );
}

// Helper: get depot by ID
export function getDepotById(id: string): MockDepot | undefined {
  return mockDepots.find((d) => d.id === id);
}

// Stock level config
export const stockLevelConfig = {
  high: { label: "High Stock", color: "text-green-700", bg: "bg-green-100", dot: "bg-green-500" },
  medium: { label: "Medium Stock", color: "text-amber-700", bg: "bg-amber-100", dot: "bg-amber-500" },
  low: { label: "Low Stock", color: "text-red-700", bg: "bg-red-100", dot: "bg-red-500" },
  out_of_stock: { label: "Out of Stock", color: "text-slate-500", bg: "bg-slate-100", dot: "bg-slate-400" },
};