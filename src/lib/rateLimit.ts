// ごく簡易的なレート制限(IPごとに一定時間あたりのリクエスト数を制限する)
//
// 注意: サーバーレス環境(Vercel)ではインスタンスが使い回されない場合があるため、
// この実装は「ないよりはマシ」程度の簡易対策です。
// 本格的に運用する場合は Upstash Redis などの外部ストアを使ってください。

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60 * 1000; // 1分
const MAX_REQUESTS_PER_WINDOW = 10;

export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
} {
  const now = Date.now();
  const existing = buckets.get(identifier);

  if (!existing || existing.resetAt < now) {
    buckets.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - existing.count };
}
