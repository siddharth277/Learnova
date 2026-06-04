"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  Moon,
  Sun,
  RefreshCw,
  BookOpen,
  Shield,
  BarChart3,
  Zap,
  Clock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { useAuthContext } from "@/contexts/AuthContext";
import { parseUserIntent } from "@/services/ai-agent/intentparser.js";

// ---------------------------------------------------------------------------
// Constants — centralized
// ---------------------------------------------------------------------------
const CONTACT_INFO = {
  email: "support@learnova.edu",
  phone: "+1 (555) 019-2834",
  demo: "https://learnova.edu",
  website: "https://learnova.edu",
};

// ---------------------------------------------------------------------------
// Knowledge base
// ---------------------------------------------------------------------------
const learnovaKnowledge = {
  platform:
    "Learnova is a comprehensive Smart Student Engagement Ecosystem that combines attendance automation, smart curriculum activities, AI-powered personalization, and real-time communication for educational institutions.",

  attendance: {
    features: [
      "GPS Geofencing + Time Window validation",
      "Multi-factor authentication (GPS + Time + Optional QR)",
      "Face liveness detection for anti-proxy measures",
      "Offline-first storage with automatic sync",
      "Exception handling with teacher approval workflow",
      "6-8 digit secure passcodes with special characters",
      "Device fingerprinting and session management",
    ],
    benefits:
      "Saves ~1 hour daily per teacher, 99%+ accuracy, eliminates proxy attendance",
  },

  security: {
    features: [
      "End-to-end encrypted routes with JWT tokens",
      "Role-based access (Student/Teacher/Admin/Parent)",
      "AES-256 database encryption",
      "Triple verification (Mobile + Email + Institute code)",
      "Real-time fraud detection and IP tracking",
      "GDPR and FERPA compliance",
      "Duplicate page blocking and session timeout",
    ],
    privacy:
      "Privacy-first architecture with data minimization and user consent management",
  },

  activities: {
    types: [
      "Interactive quizzes and gamified MCQs",
      "Coding challenges and programming puzzles",
      "AI-powered personalized recommendations",
      "Career goal mapping and skill assessments",
      "Leaderboards and achievement systems",
      "Collaborative learning and study groups",
    ],
    impact: "Converts 90+ idle hours yearly into productive learning",
  },

  analytics: {
    dashboards: [
      "Unified student progress tracking",
      "Teacher management tools with trend analysis",
      "Administrative heatmaps and insights",
      "Parent visibility into child's performance",
      "Export capabilities (CSV/PDF/Excel)",
      "Predictive analytics for early intervention",
    ],
  },

  technology: {
    frontend: "Next.js PWA with TailwindCSS, offline-first architecture",
    backend: "Node.js/NestJS with Firebase/PostgreSQL",
    ai: "Python microservices for personalized recommendations",
    security: "Firebase Auth with multi-factor validation",
    deployment: "Vercel frontend, scalable cloud backend",
  },
};
// ---------------------------------------------------------------------------
// Custom Syntax Highlighting & Code Block Rendering
// ---------------------------------------------------------------------------
function highlightCode(code, language) {
  if (!code) return "";
  const lang = (language || "").toLowerCase();

  const jsKeywords =
    /\b(const|let|var|function|return|import|export|class|if|else|for|while|try|catch|finally|true|false|null|undefined|new|this|typeof|instanceof|async|await|default|extends|from)\b/g;
  const pyKeywords =
    /\b(def|class|return|if|elif|else|for|while|try|except|finally|import|from|as|in|is|not|and|or|True|False|None|lambda|pass|break|continue|with|assert)\b/g;
  const cppKeywords =
    /\b(int|float|double|char|bool|void|class|struct|public|private|protected|template|typename|return|if|else|for|while|do|switch|case|default|break|continue|new|delete|namespace|using|std|cout|cin|endl)\b/g;
  const bashKeywords =
    /\b(echo|exit|cd|ls|mkdir|rm|cp|mv|sudo|apt|git|if|then|else|fi|for|in|do|done|while|case|esac|function)\b/g;

  let keywordRegex = jsKeywords;
  if (lang === "python" || lang === "py") keywordRegex = pyKeywords;
  else if (lang === "cpp" || lang === "c++" || lang === "c")
    keywordRegex = cppKeywords;
  else if (lang === "bash" || lang === "sh") keywordRegex = bashKeywords;
  else if (lang === "json") keywordRegex = /\b(true|false|null)\b/g;

  const tokenRegex = new RegExp(
    `(\\/\\/.*|#.*|\\/\\*[\\s\\S]*?\\*\\/)|` +
      `("(?:[^"\\\\\\n]|\\\\.)*"|'(?:[^'\\\\\\n]|\\\\.)*'|\`(?:[^\`\\\\\\n]|\\\\.)*\`)|` +
      `(\\b\\d+(?:\\.\\d+)?\\b)|` +
      `(${keywordRegex.source})|` +
      `(\\b[a-zA-Z_]\\w*(?=\\())`,
    "g"
  );

  const elements = [];
  let lastIndex = 0;
  let match;

  tokenRegex.lastIndex = 0;

  while ((match = tokenRegex.exec(code)) !== null) {
    const textBefore = code.slice(lastIndex, match.index);
    if (textBefore) {
      elements.push(textBefore);
    }

    const matchedText = match[0];
    if (match[1]) {
      elements.push(
        <span key={match.index} className="text-gray-500 italic">
          {matchedText}
        </span>
      );
    } else if (match[2]) {
      elements.push(
        <span key={match.index} className="text-green-600 dark:text-green-400">
          {matchedText}
        </span>
      );
    } else if (match[3]) {
      elements.push(
        <span key={match.index} className="text-amber-600 dark:text-amber-400">
          {matchedText}
        </span>
      );
    } else if (match[4]) {
      elements.push(
        <span key={match.index} className="text-purple-600 dark:text-purple-400 font-medium">
          {matchedText}
        </span>
      );
    } else if (match[5]) {
      elements.push(
        <span key={match.index} className="text-blue-600 dark:text-blue-400">
          {matchedText}
        </span>
      );
    }
    lastIndex = tokenRegex.lastIndex;
  }

  const textAfter = code.slice(lastIndex);
  if (textAfter) {
    elements.push(textAfter);
  }

  return elements;
}

export default function ChatBot() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuthContext();
  const t = useTranslations("ChatBot");

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("general");

  const messagesEndRef = useRef(null);

  const categories = [
    { id: "general", label: t("categories.general"), icon: BookOpen },
    { id: "attendance", label: t("categories.attendance"), icon: Clock },
    { id: "activities", label: t("categories.activities"), icon: Zap },
    { id: "security", label: t("categories.security"), icon: Shield },
    { id: "analytics", label: t("categories.analytics"), icon: BarChart3 },
  ];

  const suggestedQuestions = {
    general: [
      t("suggestedQuestions.general.q1"),
      t("suggestedQuestions.general.q2"),
      t("suggestedQuestions.general.q3"),
      t("suggestedQuestions.general.q4"),
    ],
    attendance: [
      t("suggestedQuestions.attendance.q1"),
      t("suggestedQuestions.attendance.q2"),
      t("suggestedQuestions.attendance.q3"),
      t("suggestedQuestions.attendance.q4"),
    ],
    activities: [
      t("suggestedQuestions.activities.q1"),
      t("suggestedQuestions.activities.q2"),
      t("suggestedQuestions.activities.q3"),
      t("suggestedQuestions.activities.q4"),
    ],
    security: [
      t("suggestedQuestions.security.q1"),
      t("suggestedQuestions.security.q2"),
      t("suggestedQuestions.security.q3"),
      t("suggestedQuestions.security.q4"),
    ],
    analytics: [
      t("suggestedQuestions.analytics.q1"),
      t("suggestedQuestions.analytics.q2"),
      t("suggestedQuestions.analytics.q3"),
      t("suggestedQuestions.analytics.q4"),
    ],
  };
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: t("welcomeMessage"),
        timestamp: new Date(),
      },
    ]);
  }, [t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const messageContent = textToSend || inputValue;
    if (!messageContent.trim()) return;

    if (!textToSend) setInputValue("");

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const parserResponse = await parseUserIntent(messageContent, activeCategory);
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: parserResponse || t("fallbackMessage"),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: t("errorMessage"),
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center gap-2"
        aria-label={t("openBot")}
      >
        <MessageCircle className="h-6 w-6" />
        <span className="font-medium hidden md:inline">{t("chatTitle")}</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed right-6 bottom-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl transition-all duration-300 z-50 flex flex-col ${
        isMinimized ? "h-16 w-80" : "h-[600px] w-[400px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]"
      }`}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-850 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{t("chatTitle")}</h3>
            {!isMinimized && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
                {t("onlineStatus")}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex gap-1 p-2 overflow-x-auto border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 dark:bg-gray-900/10">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role !== "user" && (
                  <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mt-0.5 shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl p-3 text-sm shadow-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-750 rounded-tl-none"
                  }`}
                >
                  <ReactMarkdown className="prose dark:prose-invert prose-xs max-w-none">
                    {msg.content}
                  </ReactMarkdown>
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 mt-0.5 shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Bot className="h-4 w-4 animate-bounce" />
                </div>
                <div className="bg-white dark:bg-gray-800 text-gray-500 rounded-2xl rounded-tl-none p-3 border border-gray-100 dark:border-gray-750 flex items-center gap-1.5 text-xs">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  {t("loadingStatus")}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-2 border-t border-gray-100 dark:border-gray-800/60 bg-gray-50/20 dark:bg-gray-900/5 max-h-24 overflow-y-auto space-y-1">
            {suggestedQuestions[activeCategory]?.map((quest, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSendMessage(quest)}
                className="w-full text-left px-2.5 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-gray-850 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 border border-gray-200/60 dark:border-gray-800 rounded-lg transition-colors overflow-hidden text-ellipsis whitespace-nowrap block"
              >
                {quest}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-gray-200 dark:border-gray-800 flex gap-2 items-center bg-white dark:bg-gray-900 rounded-b-2xl"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t("placeholder")}
              className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-500/30 transition-all placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl shadow-md transition-all flex items-center justify-center shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
