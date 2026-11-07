import { ToastHost } from "@/components/ui/ToastHost";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="page-enter min-h-dvh">
      {children}
      <ToastHost />
    </div>
  );
}
