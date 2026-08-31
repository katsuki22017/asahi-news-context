import type { Article } from "./types";
import articlesData from "@/data/articles.json";

const articles = articlesData as Article[];

/**
 * ユーザーの入力(つぶやき)と、記事のキーワード・タイトル・テーマとの
 * 単純な文字列一致でスコアリングし、関連度の高い記事を返す。
 *
 * AIを使わずにここで一次的な絞り込みをすることで、
 * ・関係ない記事がAIの出力に紛れ込むリスクを減らす
 * ・AI APIの呼び出し回数(コスト)を抑える
 * という2つの効果がある。
 */
export function matchArticles(userInput: string, topN = 5): Article[] {
  const normalizedInput = userInput.toLowerCase();

  const scored = articles.map((article) => {
    let score = 0;

    for (const keyword of article.keywords) {
      if (normalizedInput.includes(keyword.toLowerCase())) {
        score += 3;
      }
    }

    if (normalizedInput.includes(article.topic.toLowerCase())) {
      score += 2;
    }

    // タイトルの単語がちょっとでも入力に含まれていたら加点(簡易的)
    for (const word of article.title.split(/[\s、。「」・]/)) {
      if (word.length >= 2 && normalizedInput.includes(word.toLowerCase())) {
        score += 1;
      }
    }

    return { article, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((s) => s.article);
}

export function getAllTopics(): string[] {
  return Array.from(new Set(articles.map((a) => a.topic)));
}
