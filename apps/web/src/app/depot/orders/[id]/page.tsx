import ClientPage from "./page-client";

// Static export: enumerate the demo entities this detail page serves.
// The client component reads the id itself via useParams().
export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
    { id: "5" },
    { id: "6" },
    { id: "7" }
  ];
}

export default function Page() {
  return <ClientPage />;
}
