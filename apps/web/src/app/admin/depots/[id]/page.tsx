import ClientPage from "./page-client";

// Static export: enumerate the demo entities this detail page serves.
// The client component reads the id itself via useParams().
export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { id: "DEP-001" },
    { id: "DEP-002" },
    { id: "DEP-003" }
  ];
}

export default function Page() {
  return <ClientPage />;
}
