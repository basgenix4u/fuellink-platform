// src/app/depot/chat/page.tsx
// Depot view of all marketer conversations
// Depot can see what the AI said and jump in when needed
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Bot,
  MessageSquare,
  ArrowLeft,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShoppingCart,
  User,
} from "lucide-react";
import { ChatWindow } from "@/components/shared/ChatWindow";
import { Badge } from "@/components/shared/Badge";
import { cn, formatRelativeTime } from "@/lib/utils";

interface MarketerConversation {
  id: string;
  marketerId: string;
  marketerName: string;
  marketerBusiness: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  aiHandling: boolean; // true = AI is handling it solo, false = depot jumped in
  needsAttention: boolean; // AI flagged: marketer ready to order
  product: string;
  inquiredQuantity?: number;
  status: "ai_active" | "depot_active" | "order_placed" | "idle";
}

const MOCK_MARKETER_CONVS: MarketerConversation[] = [
  {
    id: "mc-1",
    marketerId: "marketer-001",
    marketerName: "Adamu Usman",
    marketerBusiness: "Adamu Petroleum",
    lastMessage: "I want 33,000 litres. Can the price be ₦900?",
    lastMessageTime: new Date(Date.now() - 60000).toISOString(),
    unreadCount: 1,
    aiHandling: false,
    needsAttention: true,
    product: "PMS",
    inquiredQuantity: 33000,
    status: "depot_active",
  },
  {
    id: "mc-2",
    marketerId: "marketer-002",
    marketerName: "Chiamaka Obi",
    marketerBusiness: "ChiOil Distributors",
    lastMessage: "AI: Current AGO stock and pricing shared. Marketer reviewing.",
    lastMessageTime: new Date(Date.now() - 900000).toISOString(),
    unreadCount: 0,
    aiHandling: true,
    needsAttention: false,
    product: "AGO",
    inquiredQuantity: 66000,
    status: "ai_active",
  },
  {
    id: "mc-3",
    marketerId: "marketer-003",
    marketerName: "Emeka Nwosu",
    marketerBusiness: "Emeka Fuels Ltd",
    lastMessage: "Voice note received — transcribed from Hausa. Price inquiry.",
    lastMessageTime: new Date(Date.now() - 1800000).toISOString(),
    unreadCount: 0,
    aiHandling: true,
    needsAttention: false,
    product: "PMS",
    status: "ai_active",
  },
  {
    id: "mc-4",
    marketerId: "marketer-004",
    marketerName: "Bola Adeyemi",
    marketerBusiness: "Bola Energy Consult",
    lastMessage: "Payment confirmed. QR code sent. Ready for loading.",
    lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
    unreadCount: 0,
    aiHandling: false,
    needsAttention: false,
    product: "AGO",
    inquiredQuantity: 44000,
    status: "order_placed",
  },
];

const statusConfig = {
  ai_active: { label: "AI Handling", color: "bg-blue-100 text-blue-700", icon: Bot },
  depot_active: { label: "You're In", color: "bg-amber-100 text-amber-700", icon: User },
  order_placed: { label: "Order Placed", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  idle: { label: "Idle", color: "bg-slate-100 text-slate-500", icon: Clock },
};

function ConversationItem({
  conv,
  isSelected,
  onClick,
}: {
  conv: MarketerConversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const status = statusConfig[conv.status];
  const StatusIcon = status.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all duration-150 border-b border-slate-50",
        isSelected ? "bg-primary-50 border-r-2 border-r-primary-400" : "hover:bg-slate-50"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700 font-bold text-sm">
          {conv.marketerName.charAt(0)}
        </div>
        {conv.needsAttention && (
          <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-semibold text-sm text-slate-900 truncate">{conv.marketerName}</span>
          <span className="text-[11px] text-slate-400 flex-shrink-0 ml-2">
            {formatRelativeTime(conv.lastMessageTime)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mb-1">
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full", status.color)}>
            <StatusIcon className="w-2.5 h-2.5" />
            {status.label}
          </span>
          <span className="text-[10px] text-slate-400">{conv.product}</span>
          {conv.inquiredQuantity && (
            <span className="text-[10px] text-slate-400">{conv.inquiredQuantity.toLocaleString()}L</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
          {conv.unreadCount > 0 && (
            <span className="ml-2 flex-shrink-0 w-5 h-5 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function DepotChatPage() {
  const [selected, setSelected] = useState<MarketerConversation | null>(MOCK_MARKETER_CONVS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showMobileList, setShowMobileList] = useState(true);

  const needsAttentionCount = MOCK_MARKETER_CONVS.filter((c) => c.needsAttention).length;

  const filtered = MOCK_MARKETER_CONVS.filter((c) => {
    const matchesSearch =
      c.marketerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.marketerBusiness.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex h-[calc(100vh-72px)] overflow-hidden">

      {/* ── Conversation list ── */}
      <div
        className={cn(
          "w-full sm:w-80 lg:w-96 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col",
          showMobileList ? "flex" : "hidden sm:flex"
        )}
      >
        {/* Header */}
        <div className="px-4 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-slate-900">Marketer Chats</h1>
              {needsAttentionCount > 0 && (
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {needsAttentionCount} need{needsAttentionCount > 1 ? "" : "s"} your attention
                </p>
              )}
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search marketers..."
              className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { id: "all", label: "All" },
              { id: "depot_active", label: "You're In" },
              { id: "ai_active", label: "AI Handling" },
              { id: "order_placed", label: "Orders" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={cn(
                  "flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full font-semibold transition-colors",
                  filterStatus === f.id
                    ? "bg-primary-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI summary banner */}
        <div className="mx-3 mt-2 mb-1 bg-primary-50 border border-primary-100 rounded-xl px-3 py-2 flex items-start gap-2">
          <Bot className="w-3.5 h-3.5 text-primary-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-primary-700 leading-relaxed">
            Your AI is handling {MOCK_MARKETER_CONVS.filter((c) => c.status === "ai_active").length} chats automatically. Jump in when a deal is ready.
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conv={conv}
              isSelected={selected?.id === conv.id}
              onClick={() => { setSelected(conv); setShowMobileList(false); }}
            />
          ))}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className={cn("flex-1 flex flex-col", showMobileList ? "hidden sm:flex" : "flex")}>
        {selected ? (
          <>
            {/* Mobile back */}
            <div className="sm:hidden px-3 py-2 bg-white border-b border-slate-100 flex items-center gap-2">
              <button
                onClick={() => setShowMobileList(true)}
                className="flex items-center gap-1.5 text-sm text-primary-600 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Chats
              </button>
            </div>

            {/* Attention banner */}
            {selected.needsAttention && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-4 mt-3 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex items-center gap-3"
              >
                <ShoppingCart className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-800">
                    {selected.marketerName} is ready to order {selected.inquiredQuantity?.toLocaleString()}L of {selected.product}
                  </p>
                  <p className="text-xs text-orange-600">
                    Jump in to confirm the price and close the deal.
                  </p>
                </div>
              </motion.div>
            )}

            <ChatWindow
              chatId={selected.id}
              depotId="depot-001"
              depotName={`Chat with ${selected.marketerName}`}
              currentUserRole="depot"
              currentUserId="depot-001"
              currentUserName="Pinnacle Operations"
              isFullPage
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
            <MessageSquare className="w-12 h-12 mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-600 mb-1">Select a conversation</h3>
            <p className="text-sm text-center max-w-xs">
              Your AI is handling inquiries. Jump in when a marketer is ready to deal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}