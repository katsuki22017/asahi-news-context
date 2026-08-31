import type { AnalyzeResult } from "@/lib/types";

export function ResultCard({ result }: { result: AnalyzeResult }) {
  return (
    <div className="space-y-4">
      {result.causalExplanation && (
        <p className="leading-relaxed whitespace-pre-wrap">{result.causalExplanation}</p>
      )}

      {result.personalRelevance && (
        <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
          {result.personalRelevance}
        </p>
      )}

      {result.timeline.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-500 mb-2">年表</h3>
          <ol className="border-l-2 border-neutral-200 pl-4 space-y-3">
            {result.timeline.map((event, i) => (
              <li key={i}>
                <div className="text-xs text-neutral-400">{event.date}</div>
                <div className="text-sm">{event.description}</div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {result.matchedArticles.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-500 mb-2">
            参考にした朝日新聞デジタルの記事
          </h3>
          <ul className="space-y-2">
            {result.matchedArticles.map((article) => (
              <li
                key={article.id}
                className="rounded-lg border border-neutral-200 px-3 py-2 hover:bg-neutral-50"
              >
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-700 hover:underline"
                >
                  {article.title}
                </a>
                <div className="text-xs text-neutral-400 mt-0.5">{article.date}</div>
                <p className="text-sm text-neutral-600 mt-1">{article.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
