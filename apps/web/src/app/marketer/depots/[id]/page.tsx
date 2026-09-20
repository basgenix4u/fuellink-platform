import ClientPage from "./page-client";

// Static export: enumerate the demo depots this detail page serves
// (ids mirror src/lib/mock-data/depots.ts). The client component reads
// the id itself via useParams().
export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { id: "depot-001" },
    { id: "depot-002" },
    { id: "depot-003" },
    { id: "depot-004" }
  ];
}

export default function Page() {
  return <ClientPage />;
}
