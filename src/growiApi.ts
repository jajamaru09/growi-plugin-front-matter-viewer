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
        let url: string;
        let body: string | null;

        if (revisionId) {
            // 過去リビジョン: GET /_api/v3/revisions/<revisionId>?pageId=<pageId>
            url = `/_api/v3/revisions/${encodeURIComponent(revisionId)}?pageId=${encodeURIComponent(rawId)}`;
            console.log(`[FM-DEBUG] fetch revision URL:`, url); // DEBUG
            const res = await fetch(url);
            console.log(`[FM-DEBUG] revision response status:`, res.status); // DEBUG
            if (!res.ok) return null;
            const json = await res.json();
            console.log(`[FM-DEBUG] revision json keys:`, Object.keys(json)); // DEBUG
            console.log(`[FM-DEBUG] json.revision?.body (first 200):`, String(json?.revision?.body ?? '').slice(0, 200)); // DEBUG
            body = (json?.revision?.body as string) ?? null;
        } else {
            // 最新版: GET /_api/v3/page?pageId=<pageId>
            url = `/_api/v3/page?pageId=${encodeURIComponent(rawId)}`;
            console.log(`[FM-DEBUG] fetch page URL:`, url); // DEBUG
            const res = await fetch(url);
            console.log(`[FM-DEBUG] page response status:`, res.status); // DEBUG
            if (!res.ok) return null;
            const json = await res.json();
            console.log(`[FM-DEBUG] page json keys:`, Object.keys(json)); // DEBUG
            console.log(`[FM-DEBUG] json.page?.revision?.body (first 200):`, String(json?.page?.revision?.body ?? '').slice(0, 200)); // DEBUG
            body = (json?.page?.revision?.body as string) ?? null;
        }

        return body;
    } catch (e) {
        console.error(`[FM-DEBUG] fetchPageBody error:`, e); // DEBUG
        return null;
    }
}
