// src/app/marketer/messages/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Search,
  Plus,
  Building2,
  Clock,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { ChatWindow } from "@/components/shared/ChatWindow";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Conversation {
  id: string;
  depot: {
    id: string;
    name: string;
    avatar: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  orderId?: string;
}

const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    depot: {
      id: "depot-001",
      name: "Pinnacle Oil & Gas Terminal",
      avatar: "P",
    },
    lastMessage: "Perfect. Please ensure your driver has the QR code ready.",
    lastMessageTime: "2025-02-19T09:20:00Z",
    unreadCount: 0,
    orderId: "ORD-2025-001237",
  },
  {
    id: "conv-2",
    depot: {
      id: "depot-002",
      name: "Matrix Energy Depot",
      avatar: "M",
    },
    lastMessage: "Your order is ready for pickup. We're open until 8 PM.",
    lastMessageTime: "2025-02-19T08:45:00Z",
    unreadCount: 2,
    orderId: "ORD-2025-001235",
  },
  {
    id: "conv-3",
    depot: {
      id: "depot-003",
      name: "Sahara Energy Terminal",
      avatar: "S",
    },
    lastMessage: "Thank you for your order. Looking forward to serving you again.",
    lastMessageTime: "2025-02-18T16:30:00Z",
    unreadCount: 0,
  },
];

export default function MessagesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const filteredConversations = mockConversations.filter((conv) =>
    conv.depot.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-200px)]">
      <div className="grid lg:grid-cols-3 gap-6 h-full">
        {/* Conversations List */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-slate-900">Messages</h1>
              <Badge variant="secondary">{mockConversations.length}</Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={cn(
                  "w-full p-4 text-left border-b border-slate-50 hover:bg-slate-50 transition-colors",
                  selectedConversation?.id === conv.id && "bg-secondary-50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {conv.depot.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900 truncate">
                        {conv.depot.name}
                      </p>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {formatRelativeTime(conv.lastMessageTime)}
                      </span>
                    </div>
                    {conv.orderId && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {conv.orderId}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-slate-500 truncate pr-2">
                        {conv.lastMessage}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-secondary-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {/* Empty State */}
            {filteredConversations.length === 0 && (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No conversations found</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <ChatWindow
              chatId={selectedConversation.id}
              depotId={selectedConversation.depot.id}
              depotName={selectedConversation.depot.name}
              depotInitials={selectedConversation.depot.avatar}
              currentUserRole="marketer"
              currentUserId="marketer-001"
              currentUserName="Independent Marketer"
              orderId={selectedConversation.orderId}
              isFullPage
            />
          ) : (
            <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Select a Conversation
                </h3>
                <p className="text-slate-500 max-w-sm">
                  Choose a depot from the list to start messaging or continue a conversation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}