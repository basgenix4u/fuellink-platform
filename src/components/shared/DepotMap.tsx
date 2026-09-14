// src/components/shared/DepotMap.tsx
// Google Maps integration for depot location display
// Uses iframe embed for the map + direct link to Google Maps for navigation
// AI predicts travel time from marketer location to depot
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Navigation,
  Clock,
  Truck,
  ExternalLink,
  Bot,
  AlertTriangle,
  RefreshCw,
  Car,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { cn } from "@/lib/utils";

interface DepotMapProps {
  depotName: string;
  address: string;
  coordinates: { lat: number; lng: number };
  googleMapsUrl: string; // Full Google Maps URL for navigation
  className?: string;
  showTravelPredictor?: boolean; // show the AI travel time section
}

// Nigerian cities for "from" selection
const NIGERIAN_CITIES = [
  { label: "Victoria Island, Lagos", lat: 6.4281, lng: 3.4219 },
  { label: "Ikeja, Lagos", lat: 6.5958, lng: 3.3399 },
  { label: "Lekki, Lagos", lat: 6.4698, lng: 3.5852 },
  { label: "Surulere, Lagos", lat: 6.5022, lng: 3.3534 },
  { label: "Festac, Lagos", lat: 6.4667, lng: 3.2833 },
  { label: "Mushin, Lagos", lat: 6.5322, lng: 3.3597 },
  { label: "Agege, Lagos", lat: 6.6225, lng: 3.3222 },
  { label: "Port Harcourt (Trans Amadi)", lat: 4.8156, lng: 7.0498 },
  { label: "Abuja (Kubwa)", lat: 9.0765, lng: 7.3986 },
];

// AI travel time estimator (mock — real app uses Google Distance Matrix API)
function estimateTruckTravelTime(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): { hours: number; minutes: number; distanceKm: number; trafficCondition: "clear" | "moderate" | "heavy" } {
  // Haversine formula for distance
  const R = 6371;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((fromLat * Math.PI) / 180) *
      Math.cos((toLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Truck speed: ~30-45 km/h in Lagos traffic, 60+ km/h on expressway
  const isLagos = Math.abs(fromLat - 6.5) < 0.5 && Math.abs(fromLng - 3.4) < 0.5;
  const trafficConditions: ("clear" | "moderate" | "heavy")[] = ["clear", "moderate", "heavy"];
  const trafficCondition = trafficConditions[Math.floor(Math.random() * trafficConditions.length)];
  const speedKmH = isLagos
    ? trafficCondition === "heavy" ? 18 : trafficCondition === "moderate" ? 28 : 40
    : 55;

  const totalMinutes = Math.round((distanceKm / speedKmH) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return { hours, minutes, distanceKm: Math.round(distanceKm), trafficCondition };
}

// Build Google Maps embed URL (free, no API key needed for basic embed)
function buildEmbedUrl(lat: number, lng: number, depotName: string): string {
  const encodedName = encodeURIComponent(depotName);
  // Google Maps embed — shows satellite view of exact coordinates
  return `https://maps.google.com/maps?q=${lat},${lng}&z=17&output=embed&t=k`;
}

// Build Google Maps directions URL
function buildDirectionsUrl(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): string {
  return `https://www.google.com/maps/dir/${fromLat},${fromLng}/${toLat},${toLng}/?travelmode=driving`;
}

const trafficColors = {
  clear: { text: "text-green-700", bg: "bg-green-100", label: "Light traffic" },
  moderate: { text: "text-amber-700", bg: "bg-amber-100", label: "Moderate traffic" },
  heavy: { text: "text-red-700", bg: "bg-red-100", label: "Heavy traffic" },
};

export function DepotMap({
  depotName,
  address,
  coordinates,
  googleMapsUrl,
  className,
  showTravelPredictor = true,
}: DepotMapProps) {
  const [selectedOrigin, setSelectedOrigin] = useState(0);
  const [travelEstimate, setTravelEstimate] = useState<ReturnType<typeof estimateTruckTravelTime> | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [mapError, setMapError] = useState(false);

  const embedUrl = buildEmbedUrl(coordinates.lat, coordinates.lng, depotName);

  const handleCalculateRoute = async () => {
    setIsCalculating(true);
    const origin = NIGERIAN_CITIES[selectedOrigin];
    // Simulate API call delay
    await new Promise((r) => setTimeout(r, 1200));
    const estimate = estimateTruckTravelTime(
      origin.lat,
      origin.lng,
      coordinates.lat,
      coordinates.lng
    );
    setTravelEstimate(estimate);
    setIsCalculating(false);
  };

  const directionsUrl = travelEstimate
    ? buildDirectionsUrl(
        NIGERIAN_CITIES[selectedOrigin].lat,
        NIGERIAN_CITIES[selectedOrigin].lng,
        coordinates.lat,
        coordinates.lng
      )
    : googleMapsUrl;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Map container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: "280px" }}>
        {!mapError ? (
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onError={() => setMapError(true)}
            title={`Map of ${depotName}`}
          />
        ) : (
          /* Fallback if iframe is blocked */
          <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-3">
            <MapPin className="w-10 h-10 text-slate-300" />
            <p className="text-sm text-slate-500 text-center px-4">
              Map preview unavailable.
              <br />
              Open in Google Maps to view location.
            </p>
          </div>
        )}

        {/* Overlay: depot pin label */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md border border-slate-100 flex items-center gap-2 max-w-[200px]">
          <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-slate-800 truncate">{depotName}</span>
        </div>

        {/* Coordinates badge */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] text-slate-500 font-mono">
          {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
        </div>
      </div>

      {/* Address + Open Maps button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-800">{address}</p>
            <p className="text-xs text-slate-400 mt-0.5">Exact GPS location</p>
          </div>
        </div>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0"
        >
          <button className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap">
            <ExternalLink className="w-3.5 h-3.5" />
            Open in Maps
          </button>
        </a>
      </div>

      {/* AI Travel Time Predictor */}
      {showTravelPredictor && (
        <div className="bg-gradient-to-br from-slate-900 to-primary-900 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-secondary-400" />
            <span className="text-sm font-bold">AI Travel Time Predictor</span>
          </div>
          <p className="text-xs text-white/60 mb-3">
            Select your truck's starting location — AI estimates arrival time including traffic.
          </p>

          <div className="flex gap-2 mb-3">
            <select
              value={selectedOrigin}
              onChange={(e) => {
                setSelectedOrigin(Number(e.target.value));
                setTravelEstimate(null);
              }}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary-400 appearance-none"
            >
              {NIGERIAN_CITIES.map((city, i) => (
                <option key={i} value={i} className="bg-slate-900 text-white">
                  {city.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleCalculateRoute}
              disabled={isCalculating}
              className="flex items-center gap-1.5 px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {isCalculating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Truck className="w-3.5 h-3.5" />
              )}
              {isCalculating ? "Calculating..." : "Estimate"}
            </button>
          </div>

          {/* Result */}
          {travelEstimate && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 rounded-xl p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-secondary-400" />
                  <span className="text-sm font-bold">
                    {travelEstimate.hours > 0 ? `${travelEstimate.hours}h ` : ""}
                    {travelEstimate.minutes}min
                  </span>
                  <span className="text-xs text-white/50">by truck</span>
                </div>
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                  trafficColors[travelEstimate.trafficCondition].bg,
                  trafficColors[travelEstimate.trafficCondition].text
                )}>
                  {trafficColors[travelEstimate.trafficCondition].label}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-white/60">
                <Navigation className="w-3.5 h-3.5" />
                <span>~{travelEstimate.distanceKm} km from {NIGERIAN_CITIES[selectedOrigin].label}</span>
              </div>

              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2 bg-secondary-500 hover:bg-secondary-600 text-white text-xs font-semibold rounded-xl transition-colors mt-1"
              >
                <Car className="w-3.5 h-3.5" />
                Open Turn-by-Turn Directions
              </a>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}