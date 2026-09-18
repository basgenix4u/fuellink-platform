// src/app/marketer/chat/page.tsx
// Full WhatsApp-style chat page for marketers
// Shows conversation list on left, chat window on right
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Bot,
  Building2,
  CheckCheck,
  Clock,
  Filter,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { ChatWindow } from "@/components/shared/ChatWindow";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { cn, formatRelativeTime } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  depotId: string;
  depotName: string;
  depotState: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  lastSenderRole: "marketer" | "depot" | "ai";
  orderId?: string;
  hasActiveOrder: boolean;
  products: string[];
}

// ─── Mock conversations ───────────────────────────────────────────────────────

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    depotId: "depot-001",
    depotName: "Pinnacle Oil & Gas Terminal",
    depotState: "Lagos",
    lastMessage: "Loading can be arranged for tomorrow morning from 7am. Do we have a deal?",
    lastMessageTime: new Date(Date.now() - 60000).toISOString(),
    unreadCount: 1,
    lastSenderRole: "depot",
    orderId: "ORD-2025-001",
    hasActiveOrder: true,
    products: ["PMS", "AGO"],
  },
  {
    id: "conv-2",
    depotId: "depot-002",
    depotName: "Matrix Energy Depot",
    depotState: "Lagos",
    lastMessage: "Current AGO stock: 2.2M litres available. Minimum 33,000L.",
    lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
    unreadCount: 0,
    lastSenderRole: "ai",
    hasActiveOrder: false,
    products: ["AGO"],
  },
  {
    id: "conv-3",
    depotId: "depot-003",
    depotName: "Forte Oil Terminal, PH",
    depotState: "Rivers",
    lastMessage: "Your inquiry has been received. The depot manager will respond shortly.",
    lastMessageTime: new Date(Date.now() - 7200000).toISOString(),
    unreadCount: 2,
    lastSenderRole: "ai",
    hasActiveOrder: false,
    products: ["PMS", "DPK"],
  },
  {
    id: "conv-4",
    depotId: "depot-004",
    depotName: "Obat Oil Terminal",
    depotState: "Delta",
    lastMessage: "We can do ₦1,148/L for AGO on 66,000L. Call back time?",
    lastMessageTime: new Date(Date.now() - 86400000).toISOString(),
    unreadCount: 0,
    lastSenderRole: "depot",
    hasActiveOrder: false,
    products: ["AGO"],
  },
];

// ─── Conversation list item ───────────────────────────────────────────────────

function ConversationItem({
  conv,
  isSelected,
  onClick,
}: {
  conv: Conversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isAI = conv.lastSenderRole === "ai";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all duration-150 border-b border-slate-50",
        isSelected ? "bg-secondary-50 border-r-2 border-r-secondary-400" : "hover:bg-slate-50"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-base">
          {conv.depotName.charAt(0)}
        </div>
        {/* AI indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center">
          <Bot className="w-2.5 h-2.5 text-primary-600" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-semibold text-sm text-slate-900 truncate">{conv.depotName}</span>
          <span className="text-[11px] text-slate-400 flex-shrink-0 ml-2">
            {formatRelativeTime(conv.lastMessageTime)}
          </span>
        </div>

        <div className="flex items-center gap-1 mb-1">
          <span className="text-xs text-slate-400">{conv.depotState}</span>
          <span className="text-slate-300">·</span>
          <div className="flex gap-1">
            {conv.products.map((p) => (
              <span key={p} className="text-[10px] font-bold text-slate-400">{p}</span>
            ))}
          </div>
          {conv.hasActiveOrder && (
            <span className="ml-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
              Active Order
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 truncate flex items-center gap-1">
            {isAI && <Bot className="w-3 h-3 text-primary-400 flex-shrink-0" />}
            {conv.lastMessage}
          </p>
          {conv.unreadCount > 0 && (
            <span className="ml-2 flex-shrink-0 w-5 h-5 bg-secondary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MarketerChatPage() {
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(MOCK_CONVERSATIONS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);

  const filtered = MOCK_CONVERSATIONS.filter(
    (c) =>
      c.depotName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.depotState.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = MOCK_CONVERSATIONS.reduce((sum, c) => sum + c.unreadCount, 0);

  const handleSelectConv = (conv: Conversation) => {
    setSelectedConv(conv);
    setShowMobileList(false); // on mobile, show chat
  };

  return (
    <div className="flex h-[calc(100vh-72px)] overflow-hidden">

      {/* ── Conversation list ── */}
      <div
        className={cn(
          "w-full sm:w-80 lg:w-96 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col",
          "sm:flex", // always visible on sm+
          showMobileList ? "flex" : "hidden sm:flex" // mobile toggle
        )}
      >
        {/* Header */}
        <div className="px-4 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-slate-900">Depot Chats</h1>
              {totalUnread > 0 && (
                <p className="text-xs text-slate-500">{totalUnread} unread messages</p>
              )}
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary-500 text-white text-xs font-semibold rounded-xl hover:bg-secondary-600 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search depots..."
              className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* AI Info banner */}
        <div className="mx-3 mt-2 mb-1 bg-primary-50 border border-primary-100 rounded-xl px-3 py-2 flex items-start gap-2">
          <Bot className="w-3.5 h-3.5 text-primary-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-primary-700 leading-relaxed">
            Each depot has an AI that answers 24/7. Voice notes in Hausa, Yoruba & Igbo are transcribed automatically.
          </p>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No conversations found</p>
            </div>
          ) : (
            filtered.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isSelected={selectedConv?.id === conv.id}
                onClick={() => handleSelectConv(conv)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div
        className={cn(
          "flex-1 flex flex-col",
          showMobileList ? "hidden sm:flex" : "flex"
        )}
      >
        {selectedConv ? (
          <>
            {/* Mobile back button */}
            <div className="sm:hidden px-3 py-2 bg-white border-b border-slate-100 flex items-center gap-2">
              <button
                onClick={() => setShowMobileList(true)}
                className="flex items-center gap-1.5 text-sm text-secondary-600 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Chats
              </button>
            </div>

            <ChatWindow
              chatId={selectedConv.id}
              depotId={selectedConv.depotId}
              depotName={selectedConv.depotName}
              currentUserRole="marketer"
              currentUserId="marketer-001"
              currentUserName="Adamu Petroleum"
              orderId={selectedConv.orderId}
              isFullPage
            />
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-5">
              <MessageSquare className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Select a conversation</h3>
            <p className="text-sm text-center max-w-xs">
              Choose a depot from the list to start chatting. The AI assistant is always available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}