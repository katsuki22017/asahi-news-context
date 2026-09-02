import type { Article } from "./types";
import articlesData from "@/data/articles.json";

const articles = articlesData as Article[];

/**
 * スコアリングの重み。
 *
 * KEYWORD:    記事のkeywordsに手動で登録した語(最も信頼できるシグナル)
 * TOPIC:      トピック名そのものが入力に含まれている
 * TITLE_WORD: タイトルの一部の単語がたまたま入力に含まれている(最も弱いシグナル)
 *
 * 記事を追加していくときのコツ:
 * ・keywordsには、口語的な言い方や活用違い
 *   (例:「値上げ」に対して「値上」「値上がり」)も入れておくと、
 *   タイトルの単語一致に頼らなくてもヒットしやすくなる。
 * ・keywordsは3〜8個程度が目安。多すぎると無関係な話題にも反応しやすくなる。
 */
const WEIGHTS = {
  KEYWORD: 3,
  TOPIC: 2,
  TITLE_WORD: 1,
} as const;

// タイトル単語一致だけで点数を稼ぎすぎないようにする上限。
// (タイトルが長い記事が、キーワードがきちんと一致している記事より
//  不当に上位に来てしまうのを防ぐため)
const TITLE_WORD_SCORE_CAP = 2;

// この文字数未満のタイトル単語は「は」「の」のような一般的すぎる語である
// 可能性が高く、無関係な記事を誤ってヒットさせやすいので対象から外す。
const MIN_TITLE_WORD_LENGTH = 3;

// この点数に届かない記事は「関連度が低すぎる」として除外する。
// キーワード(3点)かトピック(2点)のどちらか1つがヒットしていれば
// 必ず届く点数にしてあるので、タイトル単語の偶然の一致(合計でも最大2点)
// だけでは表示されないようにしている。
const MIN_SCORE_TO_MATCH = 2;

// タイトルを単語に割るときに使う区切り文字
const TITLE_SPLIT_PATTERN = /[\s、。「」・！？!?,.]/;

/** 全角英数字・記号を半角に統一し、前後の空白を削り、小文字化する */
function normalize(text: string): string {
  return text.normalize("NFKC").toLowerCase().trim();
}

export type ScoredArticle = { article: Article; score: number };

/**
 * ユーザーの入力(つぶやき)と、記事のキーワード・タイトル・テーマとの
 * 単純な文字列一致でスコアリングする。
 *
 * AIを使わずにここで一次的な絞り込みをすることで、
 * ・関係ない記事がAIの出力に紛れ込むリスクを減らす
 * ・AI APIの呼び出し回数(コスト)を抑える
 * という2つの効果がある。
 */
function scoreArticles(userInput: string): ScoredArticle[] {
  const normalizedInput = normalize(userInput);

  return articles.map((article) => {
    let score = 0;

    for (const keyword of article.keywords) {
      if (normalizedInput.includes(normalize(keyword))) {
        score += WEIGHTS.KEYWORD;
      }
    }

    if (normalizedInput.includes(normalize(article.topic))) {
      score += WEIGHTS.TOPIC;
    }

    let titleWordScore = 0;
    for (const word of article.title.split(TITLE_SPLIT_PATTERN)) {
      if (
        word.length >= MIN_TITLE_WORD_LENGTH &&
        normalizedInput.includes(normalize(word))
      ) {
        titleWordScore += WEIGHTS.TITLE_WORD;
      }
    }
    score += Math.min(titleWordScore, TITLE_WORD_SCORE_CAP);

    return { article, score };
  });
}

export function matchArticles(userInput: string, topN = 5): Article[] {
  return scoreArticles(userInput)
    .filter((s) => s.score >= MIN_SCORE_TO_MATCH)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((s) => s.article);
}

/**
 * スコアの内訳をそのまま見たいとき用のデバッグ関数。
 * しきい値によるフィルタは行わず、全記事をスコア順に返す。
 * 記事・キーワードを追加していく際、想定通りにスコアが付くか
 * 手元で確認するのに使う(例: node -e スクリプトから呼び出すなど)。
 */
export function debugScoreArticles(userInput: string): ScoredArticle[] {
  return scoreArticles(userInput).sort((a, b) => b.score - a.score);
}

export function getAllTopics(): string[] {
  return Array.from(new Set(articles.map((a) => a.topic)));
}
