import { NextRequest, NextResponse } from "next/server";
import { matchArticles } from "@/lib/match";
import { generateContext } from "@/lib/anthropic";
import { checkRateLimit } from "@/lib/rateLimit";
import type { AnalyzeResult } from "@/lib/types";

const MAX_INPUT_LENGTH = 200;

export async function POST(request: NextRequest) {
  // --- レート制限(簡易) ---
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらく待ってから試してください。" },
      { status: 429 }
    );
  }

  // --- 入力バリデーション ---
  let body: { message?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です。" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json({ error: "メッセージを入力してください。" }, { status: 400 });
  }
  if (message.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { error: `メッセージは${MAX_INPUT_LENGTH}文字以内で入力してください。` },
      { status: 400 }
    );
  }

  // --- 記事マッチング(AIを使わない一次絞り込み) ---
  const matchedArticles = matchArticles(message, 5);

  if (matchedArticles.length === 0) {
    const fallback: AnalyzeResult = {
      matchedArticles: [],
      timeline: [],
      causalExplanation:
        "関連しそうな記事が見つかりませんでした。別の言い方で入力してみてください(例: 「値上げ」「選挙」「奨学金」など、身近な出来事のキーワードを含めてみてください)。",
      personalRelevance: "",
    };
    return NextResponse.json(fallback);
  }

  // --- AIキーが未設定の場合は分かりやすいエラーを返す ---
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "サーバーにANTHROPIC_API_KEYが設定されていません。.env.local または Vercel の環境変数を確認してください。",
        matchedArticles,
      },
      { status: 500 }
    );
  }

  try {
    const generated = await generateContext(message, matchedArticles);
    const result: AnalyzeResult = {
      matchedArticles,
      ...generated,
    };
    return NextResponse.json(result);
  } catch (err) {
    console.error("generateContext failed:", err);
    return NextResponse.json(
      { error: "AIによる生成中にエラーが発生しました。時間を置いて試してください。" },
      { status: 500 }
    );
  }
}
