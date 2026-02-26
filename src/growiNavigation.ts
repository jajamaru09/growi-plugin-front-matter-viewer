/**
 * growiNavigation.ts — GROWI SPA のページ遷移を監視するユーティリティ
 *
 * ブラウザの Navigation API（window.navigation）を使ってページ遷移を検知し、
 * 重複発火を防ぎながらコールバックを呼び出す。
 *
 * Navigation API は比較的新しい仕様（Chrome 102+）だが、
 * 非対応ブラウザでは start() 内で早期リターンするためエラーにはならない。
 */

import {
    extractPageId,
    type GrowiPageContext, type PageMode,
} from './pageContext';

// ─── 型定義 ───────────────────────────────────────────────────────

/**
 * ページ遷移時に呼ばれるコールバックの型。
 * async 関数（Promise を返す関数）も受け付ける。
 */
export type PageChangeCallback = (ctx: GrowiPageContext) => void | Promise<void>;

// ─── ローカルユーティリティ ───────────────────────────────────────

/**
 * URLのハッシュ文字列をページモードに変換する。
 * GROWIは編集モード時に URL の末尾に #edit を付与する。
 *
 * @example
 * hashToMode('#edit') // → 'edit'
 * hashToMode('')      // → 'view'
 */
function hashToMode(hash: string): PageMode {
    return hash === '#edit' ? 'edit' : 'view';
}

// ─── メイン関数 ───────────────────────────────────────────────────

/**
 * ページ遷移リスナーを作成して返す。
 *
 * 返り値の start() を呼ぶと監視を開始し、stop() を呼ぶと停止する。
 * 同一ページ・同一モード・同一リビジョンへの重複遷移では発火しない。
 *
 * @param callback - ページが切り替わるたびに呼ばれる関数
 * @returns start と stop を持つオブジェクト
 */
export function createPageChangeListener(callback: PageChangeCallback): {
    start: () => void;
    stop: () => void;
} {
    // 直前に発火したときのキー。同じキーが来たら発火をスキップする。
    let lastKey: string | null = null;

    /**
     * コールバックを呼び出す内部関数。
     * 重複チェックと例外ハンドリングを担う。
     */
    function tryFire(pageId: string, mode: PageMode, revisionId?: string): void {
        // キーでページ・モード・リビジョンの組み合わせを一意に識別する
        // revisionId が undefined（最新版）のときは空文字列で代用する
        const key = `${pageId}::${mode}::${revisionId ?? ''}`;
        if (key === lastKey) return; // 同じ状態への遷移は無視
        lastKey = key;

        try {
            const result = callback({ pageId: `/${pageId}`, mode, revisionId });
            // コールバックが async 関数の場合、Promise の拒否も捕捉する
            // （try/catch だけでは async 関数の内部エラーを拾えないため）
            if (result instanceof Promise) {
                result.catch((e) => {
                    console.error('[growiNavigation] callback error', e);
                });
            }
        } catch (e) {
            // 同期エラーはここで捕捉する
            console.error('[growiNavigation] callback error', e);
        }
    }

    /**
     * Navigation API の navigate イベントハンドラ。
     * SPA内のページ遷移が発生するたびに呼ばれる。
     */
    function onNavigate(e: any): void {
        const dest = new URL(e.destination.url);
        // pageId URL でなければ（管理画面など）無視する
        const pageId = extractPageId(dest.pathname);
        if (!pageId) return;
        // ?revisionId=〈id〉 があれば過去リビジョン、なければ最新版
        const revisionId = dest.searchParams.get('revisionId') ?? undefined;
        tryFire(pageId, hashToMode(dest.hash), revisionId);
    }

    /**
     * 監視を開始する。
     * navigate イベントの登録と、初回ロード時の発火を行う。
     */
    function start(): void {
        const nav = (window as any).navigation;
        // Navigation API 非対応ブラウザ（Firefox など）では何もしない
        if (!nav) return;
        // 複数回 start() を呼ばれても二重登録しないようフラグで管理する
        if (nav._growiPluginListening) return;
        nav._growiPluginListening = true;
        nav.addEventListener('navigate', onNavigate);

        // navigate イベントは初回ページロード時には発火しないため、
        // 現在のURLを参照して初回のコールバックを手動で発火する
        const { pathname, hash } = location;
        const pageId = extractPageId(pathname);
        if (pageId) {
            const revisionId = new URL(location.href).searchParams.get('revisionId') ?? undefined;
            tryFire(pageId, hashToMode(hash), revisionId);
        }
    }

    /**
     * 監視を停止する。
     * イベントリスナーを解除して内部状態をリセットする。
     */
    function stop(): void {
        const nav = (window as any).navigation;
        nav?.removeEventListener('navigate', onNavigate);
        nav && delete nav._growiPluginListening;
        lastKey = null;
    }

    return { start, stop };
}
