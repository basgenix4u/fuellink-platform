import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Atmosphere } from "@/components/ui/Atmosphere";
import { Logo } from "@/components/shared/Logo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-[#f7f8f7]">
      <Atmosphere tone="light" />
      <header className="relative border-b border-[var(--hairline)] bg-white/80 backdrop-blur-xl">
        <div className="page-max page-x flex h-14 items-center justify-between">
          <Logo size="sm" className="press" />
          <Link
            href="/"
            className="press inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500 hover:text-primary-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to FuelLink
          </Link>
        </div>
      </header>
      <main className="page-max page-x relative py-8 lg:py-12">
        <div className="page-enter mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
