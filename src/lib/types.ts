// このプロジェクト全体で使う型定義

export type Article = {
  id: string;
  title: string; // 記事の実際の見出し
  url: string; // 記事の実際のURL(https://www.asahi.com/articles/... など)
  date: string; // 掲載日 "YYYY-MM-DD"
  summary: string; // 自分の言葉での短い要約(1〜2文。本文をコピーしない)
  keywords: string[]; // マッチングに使うキーワード
  topic: string; // 大まかなテーマ(例: "物価高", "少子化" など)
};

export type TimelineEvent = {
  // 参考記事に明記された日付("YYYY-MM"など)がある場合はそれを入れる。
  // 明記されていない段階は、架空の日付を作らず「背景」「現在」「今後」のような
  // おおまかな時期のラベルにする(詳しくは anthropic.ts のプロンプトを参照)。
  date: string;
  // 因果関係の1ステップ分の説明(causalExplanationを分解したもの)
  description: string;
};

export type AnalyzeResult = {
  matchedArticles: Article[];
  timeline: TimelineEvent[];
  causalExplanation: string; // 因果関係の説明文
  personalRelevance: string; // 「これがなぜ自分に関係あるか」の一言まとめ
};
