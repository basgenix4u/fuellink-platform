// src/components/shared/ChatWindow.tsx
// UPDATED:
// - Language: user selects preferred language manually — AI uses that for replies
// - No mention of "automatic transcription" to users — it just works silently
// - AI acts as a professional depot representative, not a bot
// - Depot staff can jump in and continue same chat thread
// - Voice note send flow is simple: record → send → AI/rep replies
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Paperclip,
  Mic,
  X,
  MoreVertical,
  CheckCheck,
  Clock,
  Play,
  Pause,
  FileText,
  Download,
  Phone,
  ArrowDown,
  Square,
  Globe,
  User,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SenderRole = "marketer" | "depot_ai" | "depot_staff";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: SenderRole;
  senderName: string;
  type: "text" | "voice" | "file" | "image";
  content: string;
  voiceUrl?: string;
  voiceDuration?: number;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
}

interface ChatWindowProps {
  chatId: string;
  depotId: string;
  depotName: string;
  depotColor?: string;
  depotInitials?: string;
  currentUserRole: "marketer" | "depot";
  currentUserId: string;
  currentUserName: string;
  orderId?: string;
  onClose?: () => void;
  isFullPage?: boolean;
  initialMessages?: ChatMessage[];
}

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ha", label: "Hausa", flag: "🇳🇬" },
  { code: "yo", label: "Yoruba", flag: "🇳🇬" },
  { code: "ig", label: "Igbo", flag: "🇳🇬" },
  { code: "pcm", label: "Pidgin", flag: "🇳🇬" },
];

// ─── Mock initial messages ────────────────────────────────────────────────────

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    senderId: "depot_rep",
    senderRole: "depot_ai",
    senderName: "Pinnacle Support",
    type: "text",
    content: "Good day! Welcome to Pinnacle Oil & Gas Terminal. How can I assist you today? You can ask about our products, stock availability, loading hours, or to start an order.",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    status: "read",
  },
];

// ─── Voice player ─────────────────────────────────────────────────────────────

function VoiceMessage({ duration = 5, isOwn }: { duration?: number; isOwn: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const step = 100 / (duration * 10);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { setPlaying(false); return 0; }
        return p + step;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [playing, duration]);

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <button
        onClick={() => setPlaying(!playing)}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
          isOwn ? "bg-white/20 hover:bg-white/30" : "bg-slate-200 hover:bg-slate-300"
        )}
      >
        {playing
          ? <Pause className="w-3.5 h-3.5" />
          : <Play className="w-3.5 h-3.5 ml-0.5" />
        }
      </button>
      <div className="flex-1">
        <div className={cn("h-1.5 rounded-full overflow-hidden", isOwn ? "bg-white/20" : "bg-slate-200")}>
          <div
            className={cn("h-full rounded-full transition-all", isOwn ? "bg-white/80" : "bg-secondary-500")}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className={cn("text-[10px] mt-0.5", isOwn ? "text-white/60" : "text-slate-400")}>{duration}s</p>
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
  const isDepotAI = msg.senderRole === "depot_ai";
  const isDepotStaff = msg.senderRole === "depot_staff";
  const isDepotSide = isDepotAI || isDepotStaff;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn("flex gap-2", isOwn ? "justify-end" : "justify-start")}
    >
      {/* Avatar — depot side only */}
      {!isOwn && (
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-white text-xs font-bold",
          isDepotStaff ? "bg-primary-600" : "bg-gradient-to-br from-slate-600 to-slate-800"
        )}>
          {isDepotStaff ? <User className="w-3.5 h-3.5" /> : msg.senderName.charAt(0)}
        </div>
      )}

      <div className={cn("max-w-[78%] flex flex-col", isOwn ? "items-end" : "items-start")}>
        {/* Sender label */}
        {!isOwn && (
          <span className="text-[11px] text-slate-400 mb-1 ml-1">
            {isDepotStaff ? `${msg.senderName} (Staff)` : msg.senderName}
          </span>
        )}

        <div className={cn(
          "rounded-2xl px-3.5 py-2.5",
          isOwn
            ? "bg-secondary-500 text-white rounded-br-sm"
            : isDepotStaff
            ? "bg-primary-50 border border-primary-200 text-slate-900 rounded-bl-sm"
            : "bg-white border border-slate-200 shadow-sm text-slate-900 rounded-bl-sm"
        )}>
          {msg.type === "voice" ? (
            <VoiceMessage duration={msg.voiceDuration} isOwn={isOwn} />
          ) : msg.type === "file" ? (
            <div className="flex items-center gap-2">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", isOwn ? "bg-white/20" : "bg-slate-100")}>
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{msg.fileName}</p>
                <p className={cn("text-[11px]", isOwn ? "text-white/60" : "text-slate-400")}>{msg.fileSize}</p>
              </div>
              <Download className="w-4 h-4 opacity-60 ml-1" />
            </div>
          ) : (
            <p className="text-sm leading-relaxed">{msg.content}</p>
          )}

          {/* Time + read status */}
          <div className={cn("flex items-center gap-1 mt-1 justify-end", isOwn ? "text-white/50" : "text-slate-400")}>
            <span className="text-[10px]">
              {new Date(msg.timestamp).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
            </span>
            {isOwn && (
              msg.status === "read"
                ? <CheckCheck className="w-3 h-3 text-blue-300" />
                : msg.status === "delivered"
                ? <CheckCheck className="w-3 h-3" />
                : <Clock className="w-3 h-3" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Voice Record Button ──────────────────────────────────────────────────────

function VoiceRecordButton({ onSend }: { onSend: (sec: number) => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const start = () => {
    setRecording(true);
    setSeconds(0);
    timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    setRecording(false);
    onSend(seconds || 1);
    setSeconds(0);
  };

  const cancel = () => {
    if (timer.current) clearInterval(timer.current);
    setRecording(false);
    setSeconds(0);
  };

  if (recording) {
    return (
      <div className="flex items-center gap-2 flex-1 bg-red-50 rounded-2xl px-3 py-2">
        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}
          className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-sm text-red-700 flex-1 font-medium">{seconds}s</span>
        <button onClick={cancel} className="p-1 text-slate-400 hover:text-red-500">
          <X className="w-4 h-4" />
        </button>
        <button onClick={stop}
          className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
          <Square className="w-3 h-3 fill-current" />
        </button>
      </div>
    );
  }

  return (
    <button onMouseDown={start} onTouchStart={start}
      className="p-2.5 text-slate-400 hover:text-secondary-500 hover:bg-secondary-50 rounded-xl transition-colors"
      title="Hold to record voice note">
      <Mic className="w-5 h-5" />
    </button>
  );
}

// ─── Main ChatWindow ──────────────────────────────────────────────────────────

export function ChatWindow({
  chatId, depotId, depotName,
  depotColor = "#166534",
  depotInitials = "D",
  currentUserRole, currentUserId, currentUserName,
  orderId, onClose, isFullPage = false,
  initialMessages = MOCK_MESSAGES,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState("en");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollDown = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => { scrollDown(false); }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const fn = () => setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
    el.addEventListener("scroll", fn);
    return () => el.removeEventListener("scroll", fn);
  }, []);

  const addMsg = (partial: Omit<ChatMessage, "id" | "timestamp" | "status">) => {
    const msg: ChatMessage = { ...partial, id: `m${Date.now()}`, timestamp: new Date().toISOString(), status: "sent" };
    setMessages((p) => [...p, msg]);
    setTimeout(() => scrollDown(), 50);
  };

  const simulateReply = (userText: string) => {
    if (currentUserRole !== "marketer") return;
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMsg({
        senderId: "depot_rep",
        senderRole: "depot_ai",
        senderName: depotName,
        type: "text",
        content: getReply(userText, depotName),
      });
    }, 1400 + Math.random() * 800);
  };

  const sendText = () => {
    if (!text.trim()) return;
    const msg = text.trim();
    setText("");
    addMsg({ senderId: currentUserId, senderRole: currentUserRole === "marketer" ? "marketer" : "depot_staff", senderName: currentUserName, type: "text", content: msg });
    simulateReply(msg);
  };

  const sendVoice = (sec: number) => {
    addMsg({ senderId: currentUserId, senderRole: currentUserRole === "marketer" ? "marketer" : "depot_staff", senderName: currentUserName, type: "voice", content: "", voiceDuration: sec });
    if (currentUserRole === "marketer") {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addMsg({ senderId: "depot_rep", senderRole: "depot_ai", senderName: depotName, type: "text", content: "I've received your voice note. Could you confirm your product of interest and required quantity so I can assist you better?" });
      }, 2000);
    }
  };

  const sendFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    addMsg({ senderId: currentUserId, senderRole: currentUserRole === "marketer" ? "marketer" : "depot_staff", senderName: currentUserName, type: "file", content: "", fileName: file.name, fileSize: `${(file.size / 1024).toFixed(1)} KB` });
    e.target.value = "";
  };

  const currentLang = LANGUAGES.find((l) => l.code === language)!;

  return (
    <div className={cn("flex flex-col bg-white", isFullPage ? "h-[calc(100vh-72px)]" : "h-[540px] rounded-2xl shadow-xl border border-slate-200")}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: depotColor }}>
          {depotInitials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm truncate">{depotName}</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs text-slate-500">Online</span>
          </div>
        </div>

        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-medium text-slate-600 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            {currentLang.flag} {currentLang.label}
            <ChevronDown className="w-3 h-3" />
          </button>
          <AnimatePresence>
            {showLangPicker && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 w-36"
              >
                {LANGUAGES.map((l) => (
                  <button key={l.code} onClick={() => { setLanguage(l.code); setShowLangPicker(false); }}
                    className={cn("w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors", language === l.code && "bg-primary-50 text-primary-700 font-semibold")}>
                    {l.flag} {l.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <Phone className="w-4 h-4" />
        </button>
        {onClose && (
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {orderId && (
        <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-100 text-xs text-slate-500">
          Re: order <span className="font-semibold text-slate-700">{orderId}</span>
        </div>
      )}

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #f8fafc 1px, transparent 0)", backgroundSize: "20px 20px" }}>
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} isOwn={m.senderId === currentUserId} />
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-2 items-end">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: depotColor }}>
                {depotInitials}
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  {[0, 0.2, 0.4].map((d) => (
                    <motion.div key={d} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: d }}
                      className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => scrollDown()}
            className="absolute bottom-20 right-5 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center border border-slate-200 text-slate-500 z-10">
            <ArrowDown className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="px-3 py-3 border-t border-slate-100 bg-white">
        <div className="flex items-end gap-2">
          <button onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-colors flex-shrink-0">
            <Paperclip className="w-5 h-5" />
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={sendFile}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />

          <textarea value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); } }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-2.5 bg-slate-100 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary-400 focus:bg-white transition-all resize-none leading-relaxed max-h-28 overflow-y-auto"
            style={{ minHeight: "44px" }}
          />

          <VoiceRecordButton onSend={sendVoice} />

          <button onClick={sendText} disabled={!text.trim()}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0",
              text.trim() ? "bg-secondary-500 text-white hover:bg-secondary-600 shadow-md" : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reply generator (mock — real: Claude API) ────────────────────────────────

function getReply(msg: string, depotName: string): string {
  const m = msg.toLowerCase();
  if (m.includes("price") || m.includes("how much") || m.includes("cost") || m.includes("nawa") || m.includes("owo"))
    return `Thank you for reaching out to ${depotName}. For current pricing on our products, please let us know:\n\n1. Which product? (PMS, AGO, DPK, LPG)\n2. What quantity (litres)?\n\nWe'll share our current price for that volume right away.`;
  if (m.includes("stock") || m.includes("available") || m.includes("do you have"))
    return `Yes, we currently have stock available. Our main products are:\n• PMS — High stock\n• AGO — High stock\n• DPK — Medium stock\n\nWhat product and quantity are you interested in?`;
  if (m.includes("order") || m.includes("buy") || m.includes("purchase"))
    return `Great! To process your order:\n\n1. Confirm product & quantity\n2. We'll share the price\n3. You pay via Providus Bank (escrow protected)\n4. Present QR code at loading gate\n\nWhat product and quantity would you like?`;
  if (m.includes("location") || m.includes("address") || m.includes("where"))
    return `We are located at:\n📍 ${depotName}\n\nYou can view our exact location and get directions in the depot profile under the "Location & Map" tab. Our AI can also estimate your truck's travel time to us.`;
  return `Thank you for your message. A representative from ${depotName} will respond to you shortly. For faster assistance, please let us know which product you need and your required quantity.`;
}
