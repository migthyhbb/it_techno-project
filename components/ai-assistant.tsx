"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  sender: "user" | "ai";
  text: string;
}

const QUICK_QUESTIONS = [
  "Berapa kredit token yang didapat?",
  "Bagaimana cara pesan ulang stok?",
  "Limbah apa saja yang diterima?",
];

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Halo! Saya Asisten AI LENTERA. Ada yang bisa saya bantu terkait pengolahan limbah atau layanan kami?",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isTyping, isOpen]);

  // FUNGSI UTAMA KIRIM PESAN TERHUBUNG KE API ROUTE
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isTyping) return;

    // 1. Tambah Pesan User
    const userMsg: Message = { sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setIsTyping(true);

    try {
      // 2. Panggil Endpoint Backend Next.js (/api/chat)
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.reply || "Maaf, AI tidak memberikan respons.",
        },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Gagal terhubung ke server AI. Pastikan koneksi internet kamu stabil.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* WINDOW CHAT AI */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-paper rounded-2xl border border-forest/10 shadow-2xl overflow-hidden flex flex-col h-[480px] max-h-[80vh] transition-all animate-in fade-in slide-in-from-bottom-4">

          {/* Header */}
          <div className="bg-forest text-cream p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center border border-gold/40 text-gold font-bold text-xs">
                AI
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm leading-tight">Asisten LENTERA</h3>
                <p className="text-[10px] text-cream/70 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse"></span> Online
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-cream/70 hover:text-cream transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Area Percakapan */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-cream/30 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] p-3 rounded-2xl leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-forest text-paper rounded-tr-none shadow-xs"
                      : "bg-white border border-forest/10 text-ink rounded-tl-none shadow-xs"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Indikator AI Mengetik */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-forest/10 p-3 rounded-2xl rounded-tl-none text-ink/50 flex items-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 bg-forest/40 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-forest/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-forest/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Chips */}
          <div className="px-3 py-2 bg-white border-t border-forest/5 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                disabled={isTyping}
                className="text-[10px] bg-forest/5 hover:bg-forest/10 border border-forest/10 text-forest px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Chat */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white border-t border-forest/10 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Tanyakan sesuatu..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isTyping}
              className="flex-1 bg-cream/40 border border-ink/15 rounded-xl px-3 py-2 text-xs outline-none focus:border-green transition-colors"
            />
            <button
              type="submit"
              disabled={isTyping || !inputMessage.trim()}
              className="bg-forest text-cream p-2 rounded-xl hover:bg-forest/90 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* TOMBOL FLOATING LOGO AI */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-forest text-gold border border-gold/30 p-3.5 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer group"
        aria-label="Tanya AI Assistant"
      >
        <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    </div>
  );
}