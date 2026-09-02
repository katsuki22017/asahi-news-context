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
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 text-center">
        現在はプロトタイプ版のため、参考記事は朝日新聞デジタルの実記事から数本のみを収録しています。記事数を増やすことで、より多様な「あれ？」に対応できます。
      </div>
      <main className="flex-1 overflow-hidden">
        <ChatUI />
      </main>
    </div>
  );
}
