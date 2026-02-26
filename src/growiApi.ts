/**
 * growiApi.ts — GROWI API からページ本文を取得するユーティリティ
 *
 * pageId は ctx.pageId の形式（例: /6995d3fcf17c96c558f6b0ab）を受け取る。
 * APIに渡す際は先頭の "/" を除いた24桁の ID を使用する。
 */

/**
 * 指定したページのMarkdown本文を取得する。
 * revisionId がある場合は過去リビジョン、なければ最新版を返す。
 *
 * @param pageId    - ctx.pageId の値（例: /6995d3fcf17c96c558f6b0ab）
 * @param revisionId - 過去リビジョンID。最新版のときは undefined
 * @returns ページ本文の文字列。取得失敗時は null
 */
export async function fetchPageBody(
    pageId: string,
    revisionId?: string,
): Promise<string | null> {
    // ctx.pageId は "/" + 24桁IDの形式なので先頭の "/" を除去する
    const rawId = pageId.startsWith('/') ? pageId.slice(1) : pageId;

    try {
        let body: string | null;

        if (revisionId) {
            // 過去リビジョン: GET /_api/v3/revisions/<revisionId>?pageId=<pageId>
            const url = `/_api/v3/revisions/${encodeURIComponent(revisionId)}?pageId=${encodeURIComponent(rawId)}`;
            const res = await fetch(url);
            if (!res.ok) return null;
            const json = await res.json();
            body = (json?.revision?.body as string) ?? null;
        } else {
            // 最新版: GET /_api/v3/page?pageId=<pageId>
            const url = `/_api/v3/page?pageId=${encodeURIComponent(rawId)}`;
            const res = await fetch(url);
            if (!res.ok) return null;
            const json = await res.json();
            body = (json?.page?.revision?.body as string) ?? null;
        }

        return body;
    } catch {
        return null;
    }
}
