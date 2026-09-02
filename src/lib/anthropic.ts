import Anthropic from "@anthropic-ai/sdk";
import type { Article, AnalyzeResult } from "./types";

// APIキーは環境変数からのみ読み込む(クライアントに絶対に渡さないこと)。
// ローカル開発では .env.local に ANTHROPIC_API_KEY=sk-ant-... を設定し、
// Vercelにデプロイするときは Vercel の Environment Variables に同じキーを登録する。
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 使用するモデル。Anthropicのモデル一覧は時期によって変わるため、
// 実際にデプロイする前に https://docs.claude.com/en/docs/about-claude/models で
// 最新のモデルIDを確認し、必要なら ANTHROPIC_MODEL 環境変数で上書きしてください。
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

const SYSTEM_PROMPT = `あなたは高校生向けニュース解説アシスタントです。
目的は、高校生が日常で感じた出来事(値上げ・不便さなど)を、社会・政治の問題として理解する手助けをすることです。

【最重要ルール】
- 与えられた「参考記事」に書かれている情報を、事実の基本的な根拠として使ってください。
- そのうえで、記事の内容につながる一般的な社会・政治・経済の教科書的な知識
  (すでに広く知られている仕組みや背景)は、積極的に使って構いません。
  教科書がいろいろな情報源をもとに書かれているのと同じように、
  「記事に書かれている具体的な事実」+「一般的に知られている仕組みの説明」を
  組み合わせて、高校生が理解しやすい説明にしてください。
- ただし、「参考記事に書かれている事実」と「一般的に知られている知識」は
  読者が区別できるようにし、出典が不確かな情報は断定せず
  「一般的には〜と言われています」「〜と考えられています」のように書いてください。
- 参考記事に無い具体的な統計・日付・固有名詞(実在しそうな数値・企業名・出来事など)を、
  事実であるかのように勝手に作り出さないでください(ハルシネーション禁止)。
  あくまで「一般的な仕組み・傾向」の説明にとどめ、存在しない具体的事実を捏造しないことが重要です。
- 参考記事のURLを絶対に改変しないでください。存在しないURLを作らないでください。
- 出力は指定されたJSON形式のみで返してください。JSON以外の文章は出力しないでください。
- 一般的な知識を使ってもなお十分に説明できない場合は、書けない部分を無理に埋めず、
  「今回参照できた記事だけでは、詳しい経緯までは分かりません」のように、情報が限られている
  ことを一度だけ簡潔に断ってから、分かる範囲で説明してください。
  timeline・causalExplanation・personalRelevanceのすべてで同じ注意書きを繰り返す必要はありません。

【年表(timeline)について】
- 年表は「日付ごとの出来事の記録」ではなく、causalExplanationで説明する因果関係の流れを
  2〜4個程度のステップに分解して、原因→結果のつながりを順を追って見やすくしたものです。
  causalExplanationが「文章」なら、timelineはその「箇条書き版」だとイメージしてください。
- 各ステップのdateには、参考記事に具体的な日付が明記されている場合はその日付
  (YYYY-MMなど)を使ってください。参考記事に明記されていない段階については、
  架空の日付を作らず「背景」「直近」「現在」「今後」のような、おおまかな時期を表す
  言葉を入れてください。
- 年表は必須ではありません。causalExplanationの内容がステップに分解するほど複雑でない
  場合(単純な1つの事実だけの場合など)は、無理に分解せずtimelineを空配列[]にしてください。`;

function buildUserPrompt(userInput: string, articles: Article[]): string {
  const articlesText = articles
    .map(
      (a, i) =>
        `[記事${i + 1}] タイトル: ${a.title}\n掲載日: ${a.date}\n要約: ${a.summary}\nURL: ${a.url}`
    )
    .join("\n\n");

  return `高校生の入力(つぶやき):「${userInput}」

参考記事:
${articlesText || "(該当する記事が見つかりませんでした)"}

以下のJSON形式で出力してください。

{
  "timeline": [{"date": "参考記事に明記された日付(例: 2026-09)、無ければ「背景」「現在」などおおまかな時期", "description": "因果関係の1ステップ分の説明(参考記事の内容に基づく)"}],
  "causalExplanation": "身近な出来事が、どういう流れで社会・政治の問題につながっているかを、高校生にも分かる言葉で3〜5文程度で説明する文章",
  "personalRelevance": "これが読者自身の生活や将来にどう関係するかを1〜2文でまとめた文章"
}

※ timelineは、システムプロンプトの【年表について】の基準を満たす場合だけ配列に要素を入れてください。
  基準を満たさない場合は "timeline": [] としてください。`;
}

export async function generateContext(
  userInput: string,
  matchedArticles: Article[]
): Promise<Pick<AnalyzeResult, "timeline" | "causalExplanation" | "personalRelevance">> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(userInput, matchedArticles),
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AIからのテキスト応答がありませんでした");
  }

  if (message.stop_reason === "max_tokens") {
    throw new Error(
      "AIの応答が長さ制限に達し、途中で切れました(max_tokens不足)。"
    );
  }

  // AIがコードブロック(```json ... ```)で返してくることがあるので剥がす
  const raw = textBlock.text.trim().replace(/^```json\s*|\s*```$/g, "");

  try {
    const parsed = JSON.parse(raw);
    return {
      timeline: parsed.timeline ?? [],
      causalExplanation: parsed.causalExplanation ?? "",
      personalRelevance: parsed.personalRelevance ?? "",
    };
  } catch {
    throw new Error("AIの応答をJSONとして解析できませんでした: " + raw.slice(0, 200));
  }
}
