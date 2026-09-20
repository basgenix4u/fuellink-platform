import ClientPage from "./page-client";

// Static export: enumerate the demo entities this detail page serves.
// The client component reads the id itself via useParams().
export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { id: "DSP-2025-001" },
    { id: "DSP-2025-002" },
    { id: "DSP-2025-003" }
  ];
}

export default function Page() {
  return <ClientPage />;
}
