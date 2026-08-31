"use client";

import { useState, useRef, useEffect } from "react";
import type { AnalyzeResult } from "@/lib/types";
import { ResultCard } from "./ResultCard";

type Message =
  | { role: "user"; text: string }
  | { role: "assistant"; result: AnalyzeResult }
  | { role: "assistant-error"; text: string }
  | { role: "assistant-loading" };

const EXAMPLES = [
  "コンビニのおにぎりがまた値上がりしてた",
  "友達が奨学金の話をしてて大変そうだった",
  "選挙のポスターが増えてきたけどよく分からない",
];

export function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "assistant-loading" }]);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();

      setMessages((prev) => {
        const withoutLoading = prev.slice(0, -1);
        if (!res.ok) {
          return [
            ...withoutLoading,
            { role: "assistant-error", text: data.error ?? "エラーが発生しました。" },
          ];
        }
        return [...withoutLoading, { role: "assistant", result: data as AnalyzeResult }];
      });
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant-error", text: "通信エラーが発生しました。もう一度試してください。" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-neutral-400 mt-12 space-y-4">
            <p className="text-sm">
              日常で「あれ？」と思った出来事をつぶやいてみてください。
              <br />
              関連する朝日新聞デジタルの記事や、社会とのつながりを一緒に整理します。
            </p>
            <div className="flex flex-col gap-2 items-center">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => handleSend(ex)}
                  className="text-xs rounded-full border border-neutral-300 px-3 py-1.5 text-neutral-600 hover:bg-neutral-100"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          if (m.role === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%]">
                  {m.text}
                </div>
              </div>
            );
          }
          if (m.role === "assistant-loading") {
            return (
              <div key={i} className="flex justify-start">
                <div className="bg-neutral-100 rounded-2xl rounded-bl-sm px-4 py-2 text-neutral-400 text-sm">
                  考え中...
                </div>
              </div>
            );
          }
          if (m.role === "assistant-error") {
            return (
              <div key={i} className="flex justify-start">
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl rounded-bl-sm px-4 py-2 text-sm max-w-[85%]">
                  {m.text}
                </div>
              </div>
            );
          }
          return (
            <div key={i} className="flex justify-start">
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[90%]">
                <ResultCard result={m.result} />
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="border-t border-neutral-200 p-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="身近な出来事をつぶやいてみる..."
          maxLength={200}
          disabled={isLoading}
          className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-100"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          送信
        </button>
      </form>
    </div>
  );
}
