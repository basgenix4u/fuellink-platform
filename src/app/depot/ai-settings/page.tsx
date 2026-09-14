// src/app/depot/ai-settings/page.tsx
// Configure the AI chatbot for your depot
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Save,
  Globe,
  MessageSquare,
  Mic,
  Settings,
  CheckCircle2,
  RefreshCw,
  Info,
  Zap,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ha", label: "Hausa", flag: "🇳🇬" },
  { code: "yo", label: "Yoruba", flag: "🇳🇬" },
  { code: "ig", label: "Igbo", flag: "🇳🇬" },
  { code: "pcm", label: "Nigerian Pidgin", flag: "🇳🇬" },
  { code: "fr", label: "French", flag: "🇫🇷" },
];

const RESPONSE_STYLES = [
  { id: "professional", label: "Professional", desc: "Formal tone, thorough responses" },
  { id: "friendly", label: "Friendly", desc: "Warm, conversational, approachable" },
  { id: "concise", label: "Concise", desc: "Short, direct answers only" },
];

const QUICK_REPLIES = [
  "Check availability",
  "What's your minimum order?",
  "Do you have PMS?",
  "Do you have AGO?",
  "What are your loading hours?",
  "What's the price today?",
];

export default function AISettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["en", "ha", "yo", "ig"]);
  const [responseStyle, setResponseStyle] = useState("professional");
  const [greeting, setGreeting] = useState(
    "Hello! I'm the AI assistant for Pinnacle Oil & Gas Terminal. I can help you with stock availability, pricing, and order inquiries. How can I assist you today?\n\nYou can also send a voice note in Hausa, Yoruba, or Igbo — I'll transcribe and reply."
  );
  const [priceDisclosure, setPriceDisclosure] = useState<"range" | "exact" | "none">("range");
  const [autoEscalate, setAutoEscalate] = useState(true);
  const [selectedQuickReplies, setSelectedQuickReplies] = useState(QUICK_REPLIES.slice(0, 4));

  const toggleLanguage = (code: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1400));
    setIsSaving(false);
    toast.success("AI settings saved. Changes are live immediately.");
  };

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Chatbot Settings</h1>
          <p className="text-sm text-slate-500">Configure how your AI handles marketer inquiries</p>
        </div>
      </div>

      <div className="space-y-5">

        {/* ── Enable/Disable AI ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-primary-600" />
              <div>
                <p className="font-semibold text-slate-900">AI Chatbot</p>
                <p className="text-sm text-slate-500">
                  {aiEnabled ? "Active — handling marketer inquiries 24/7" : "Inactive — marketers cannot chat"}
                </p>
              </div>
            </div>
            <button onClick={() => setAiEnabled(!aiEnabled)}>
              {aiEnabled ? (
                <ToggleRight className="w-10 h-10 text-primary-600" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-300" />
              )}
            </button>
          </div>
        </div>

        {/* ── Greeting message ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-primary-600" />
            <h2 className="font-semibold text-slate-900">Greeting Message</h2>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            This is the first message marketers see when they open a chat with your depot.
          </p>
          <textarea
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none leading-relaxed"
          />
          <p className="text-[11px] text-slate-400 mt-1.5">{greeting.length}/500 characters</p>
        </div>

        {/* ── Languages ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-primary-600" />
            <h2 className="font-semibold text-slate-900">Supported Languages</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Voice notes and text messages will be auto-detected and replied to in the marketer's language.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = selectedLanguages.includes(lang.code);
              return (
                <button
                  key={lang.code}
                  onClick={() => toggleLanguage(lang.code)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all",
                    isSelected
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  )}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.label}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-primary-500" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Price Disclosure ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-primary-600" />
            <h2 className="font-semibold text-slate-900">Price Disclosure in Chat</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Control what the AI reveals when a marketer asks about price.
          </p>
          <div className="space-y-2">
            {[
              { id: "range" as const, label: "Share price range", desc: "AI says 'between ₦897–₦915/L' — encourages negotiation" },
              { id: "exact" as const, label: "Share exact price", desc: "AI reveals your set price directly" },
              { id: "none" as const, label: "Don't reveal prices", desc: "AI says 'contact us for pricing' and escalates" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPriceDisclosure(opt.id)}
                className={cn(
                  "w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all",
                  priceDisclosure === opt.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all",
                  priceDisclosure === opt.id ? "border-primary-500 bg-primary-500" : "border-slate-300"
                )}>
                  {priceDisclosure === opt.id && (
                    <div className="w-full h-full rounded-full bg-white scale-[0.4]" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{opt.label}</p>
                  <p className="text-xs text-slate-500">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Response style ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Response Style</h2>
          <div className="grid grid-cols-3 gap-3">
            {RESPONSE_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setResponseStyle(style.id)}
                className={cn(
                  "p-3 rounded-xl border-2 text-center transition-all",
                  responseStyle === style.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <p className="text-sm font-semibold text-slate-900">{style.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{style.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Auto-escalate ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900 mb-0.5">Auto-escalate to You</p>
              <p className="text-sm text-slate-500 max-w-sm">
                When a marketer is ready to place an order, the AI automatically notifies you and hands off the conversation.
              </p>
            </div>
            <button onClick={() => setAutoEscalate(!autoEscalate)}>
              {autoEscalate ? (
                <ToggleRight className="w-10 h-10 text-primary-600" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-300" />
              )}
            </button>
          </div>
        </div>

        {/* Save button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          leftIcon={<Save className="w-4 h-4" />}
          isLoading={isSaving}
          loadingText="Saving..."
          onClick={handleSave}
        >
          Save AI Settings
        </Button>
      </div>
    </div>
  );
}
