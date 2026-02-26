/**
 * pageContext.ts — GROWI ページURL に関する型定義とユーティリティ
 *
 * growiNavigation.ts から import して使用する。
 * 将来的に他のファイルからも再利用できるよう独立したモジュールとして管理する。
 */

// ─── 型定義 ───────────────────────────────────────────────────────

/** ページの表示モード。閲覧(view) か 編集(edit) のいずれか */
export type PageMode = 'view' | 'edit';

/**
 * ページ遷移コールバックに渡されるコンテキスト情報。
 *
 * @property pageId     - ページのURL（例: /6995d3fcf17c96c558f6b0ab）
 * @property mode       - 閲覧(view) または 編集(edit)
 * @property revisionId - 過去リビジョン表示時のみ存在するクエリパラメータ値。
 *                        最新版を表示している場合は undefined
 */
export interface GrowiPageContext {
  pageId: string;
  mode: PageMode;
  revisionId?: string;
}

// ─── 定数 ────────────────────────────────────────────────────────
// GROWIのページIDはMongoDBのObjectId形式（24桁の16進数文字列）。
// URLパターン例: /6995d3fcf17c96c558f6b0ab
const PAGE_ID_RE = /^\/([0-9a-f]{24})$/i;

// ─── ユーティリティ関数 ───────────────────────────────────────────

/**
 * pathname が GROWI の pageId URL（/〈24桁hex〉）かどうかを判定する。
 * 管理画面(/admin)や検索ページ(/search)などでは false を返す。
 */
export function isPageIdUrl(pathname: string): boolean {
  return PAGE_ID_RE.test(pathname);
}

/**
 * pathname から pageId 文字列を抽出する。
 * pageId URL でない場合は null を返す。
 *
 * @example
 * extractPageId('/6995d3fcf17c96c558f6b0ab') // → '6995d3fcf17c96c558f6b0ab'
 * extractPageId('/admin') // → null
 */
export function extractPageId(pathname: string): string | null {
  const m = pathname.match(PAGE_ID_RE);
  return m ? m[1] : null;
}
