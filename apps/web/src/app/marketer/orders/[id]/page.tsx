import { Suspense } from "react";
import ClientPage from "./page-client";

// Static export: enumerate the demo orders this detail page serves.
// The client component reads the id itself via useParams().
export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { id: "ORD-2025-001231" },
    { id: "ORD-2025-001232" },
    { id: "ORD-2025-001233" },
    { id: "ORD-2025-001234" },
    { id: "ORD-2025-001235" },
    { id: "ORD-2025-001236" },
    { id: "ORD-2025-001237" }
  ];
}

export default function Page() {
  // Suspense is required for static generation: the client uses
  // useSearchParams(), which must be suspended during prerender.
  return (
    <Suspense>
      <ClientPage />
    </Suspense>
  );
}
