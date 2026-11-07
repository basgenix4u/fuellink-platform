import { Reveal } from "@/components/ui/Reveal";
import {
  Phone,
  Clock,
  AlertTriangle,
  HelpCircle,
  XCircle,
  TrendingDown,
  MessageSquare,
  Truck,
} from "lucide-react";
import { Container } from "@/components/shared/Container";

const problems = [
  {
    icon: Phone,
    title: "Endless Phone Calls",
    description:
      "Marketers spend 2-4 hours daily calling depots to check prices. Information is often outdated by the time they act.",
    stat: "2-4 hrs",
    statLabel: "wasted daily",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    icon: HelpCircle,
    title: "Price Opacity",
    description:
      "No single source of truth for depot prices. Middlemen profit from information asymmetry while marketers overpay.",
    stat: "₦10-25",
    statLabel: "overpaid per litre",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: Truck,
    title: "Phantom Inventory",
    description:
      "Trucks dispatched based on verbal assurances often arrive to find depots sold out. Wasted trips cost millions.",
    stat: "₦200K+",
    statLabel: "per wasted trip",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: AlertTriangle,
    title: "Zero Security",
    description:
      "Transactions worth ₦30-50M happen via bank transfers to personal accounts. No escrow, no protection, no recourse.",
    stat: "₦20B+",
    statLabel: "lost to fraud yearly",
    color: "text-red-600",
    bgColor: "bg-red-600/10",
  },
];

const chaosMessages = [
  { text: "Bros, wetin be current price for AGO?", time: "6:32 AM" },
  { text: "Oga price don change o, now na ₦1150", time: "6:45 AM" },
  { text: "Abeg which depot get stock?", time: "7:01 AM" },
  { text: "Truck don reach, dem say no stock again 😭", time: "11:23 AM" },
  { text: "Send account make I transfer", time: "2:15 PM" },
  { text: "I never see the money, send proof", time: "4:30 PM" },
];

function ChatBubble({
  message,
  index,
}: {
  message: { text: string; time: string };
  index: number;
}) {
  const isEven = index % 2 === 0;

  return (
    <Reveal className={`flex ${isEven ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isEven
            ? "bg-slate-200 text-slate-800 rounded-tl-none"
            : "bg-primary-500 text-white rounded-tr-none"
        }`}
      >
        <p className="text-sm">{message.text}</p>
        <p
          className={`text-xs mt-1 ${
            isEven ? "text-slate-500" : "text-white/70"
          }`}
        >
          {message.time}
        </p>
      </div>
    </Reveal>
  );
}

export function ProblemSection() {
  return (
    <section className="section-padding bg-slate-50 overflow-hidden">
      <Container size="wide">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-red-600 font-semibold text-sm uppercase tracking-wider mb-4">
              <XCircle className="w-4 h-4" />
              The Current Reality
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              The Petroleum Trading{" "}
              <span className="text-red-500">Chaos</span>
            </h2>
            <p className="text-lg text-slate-600">
              Every day, thousands of marketers lose money, time, and peace of
              mind navigating a broken system. Here&apos;s what they face:
            </p>
          </Reveal>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-start">
          {/* Left - Problem Cards */}
          <div className="space-y-6">
            {problems.map((problem, index) => (
              <Reveal key={problem.title} className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow">
                <div className="flex gap-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl ${problem.bgColor} flex items-center justify-center`}
                  >
                    <problem.icon className={`w-6 h-6 ${problem.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {problem.title}
                    </h3>
                    <p className="text-slate-600 text-sm mb-3">
                      {problem.description}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold ${problem.color}`}>
                        {problem.stat}
                      </span>
                      <span className="text-slate-500 text-sm">
                        {problem.statLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Right - WhatsApp Chaos Visualization */}
          <Reveal className="relative" delay={300}>
            {/* Phone Frame */}
            <div className="bg-slate-900 rounded-[3rem] p-3 shadow-2xl max-w-sm mx-auto">
              <div className="bg-white rounded-[2.5rem] overflow-hidden">
                {/* Status Bar */}
                <div className="bg-primary-600 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        Fuel Dealers Lagos
                      </p>
                      <p className="text-white/70 text-xs">
                        347 participants
                      </p>
                    </div>
                  </div>
                  <Phone className="w-5 h-5 text-white" />
                </div>

                {/* Chat Messages */}
                <div className="p-4 space-y-3 bg-[#E5DDD5] min-h-[400px]">
                  {chaosMessages.map((message, index) => (
                    <ChatBubble key={index} message={message} index={index} />
                  ))}

                  {/* Typing Indicator */}
                  <Reveal className="flex justify-start" delay={800}>
                    <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full" />
                        <div className="w-2 h-2 bg-slate-400 rounded-full" />
                        <div className="w-2 h-2 bg-slate-400 rounded-full" />
                      </div>
                    </div>
                  </Reveal>
                </div>
              </div>
            </div>

            {/* Floating Warning Labels */}
            <Reveal className="absolute -top-3 right-0 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs sm:-top-4 sm:-right-4 sm:px-4 sm:py-2 sm:text-sm font-semibold shadow-lg" delay={600}>
              ❌ No Verification
            </Reveal>

            <Reveal className="absolute top-1/3 left-0 bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs sm:-left-8 sm:px-4 sm:py-2 sm:text-sm font-semibold shadow-lg" delay={700}>
              ⚠️ Outdated Info
            </Reveal>

            <Reveal className="absolute bottom-16 right-0 bg-yellow-500 text-white px-3 py-1.5 rounded-full text-xs sm:bottom-20 sm:-right-4 sm:px-4 sm:py-2 sm:text-sm font-semibold shadow-lg" delay={800}>
              💸 Payment Risk
            </Reveal>
          </Reveal>
        </div>

        {/* Bottom CTA */}
        <Reveal className="text-center mt-10 sm:mt-14" delay={500}>
          <p className="text-xl text-slate-700 font-medium">
            The industry loses over{" "}
            <span className="text-red-600 font-bold">₦100 Billion</span>{" "}
            annually to these inefficiencies.
          </p>
          <p className="text-lg text-slate-500 mt-2">
            There has to be a better way...
          </p>
        </Reveal>
      </Container>
    </section>
  );
}