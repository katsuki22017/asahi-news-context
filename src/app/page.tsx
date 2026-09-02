import { ChatUI } from "@/components/ChatUI";

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <header className="border-b border-neutral-200 px-4 py-3">
        <h1 className="text-lg font-bold">コトツナ</h1>
        <p className="text-xs text-neutral-500">
          身近な「あれ？」を、社会とのつながりに。 朝日新聞デジタルの記事から一緒に整理します。
        </p>
      </header>
      <main className="flex-1 overflow-hidden">
        <ChatUI />
      </main>
    </div>
  );
}
