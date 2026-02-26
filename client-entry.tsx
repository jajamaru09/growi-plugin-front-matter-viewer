/**
 * client-entry.tsx — GROWIスクリプトプラグインのエントリーポイント
 *
 * GROWIはビルド後のこのファイルをブラウザでロードする。
 * ファイル末尾で window.pluginActivators に { activate, deactivate } を登録すると
 * GROWIがプラグインとして認識し、適切なタイミングで呼び出す。
 */

import { createPageChangeListener } from './src/growiNavigation';
import type { GrowiPageContext } from './src/pageContext';
import { fetchPageBody } from './src/growiApi';
import { extractFrontMatter } from './src/frontMatterExtractor';
import { mountPanel, unmountPanel } from './src/sidebarMount';

// ─── グローバル型宣言 ──────────────────────────────────────────────
declare global {
    interface Window {
        pluginActivators?: Record<string, { activate(): void; deactivate(): void }>;
    }
}

// ─── 定数 ────────────────────────────────────────────────────────
// package.json の name フィールドと一致させる（GROWIがキーとして使用する）
const PLUGIN_NAME = 'growi-plugin-front-matter-viewer';

// ─── ページ遷移ハンドラ ───────────────────────────────────────────
/**
 * ページが切り替わるたびに呼ばれるコールバック。
 * ページ本文を取得 → フロントマターを抽出 → パネルを表示/非表示する。
 */
async function handlePageChange(ctx: GrowiPageContext): Promise<void> {
    // 編集モードではパネルを非表示にする
    if (ctx.mode === 'edit') {
        unmountPanel();
        return;
    }

    const body = await fetchPageBody(ctx.pageId, ctx.revisionId);
    if (!body) {
        unmountPanel();
        return;
    }

    const fm = extractFrontMatter(body);
    if (!fm) {
        // フロントマターなし → パネルを消す
        unmountPanel();
        return;
    }

    mountPanel(fm);
}

// ─── リスナーの生成 ───────────────────────────────────────────────
const { start, stop } = createPageChangeListener(handlePageChange);

// ─── プラグインライフサイクル ─────────────────────────────────────
function activate(): void {
    console.log(`[${PLUGIN_NAME}] activated`);
    start();
}

function deactivate(): void {
    console.log(`[${PLUGIN_NAME}] deactivated`);
    stop();
    unmountPanel();
}

// ─── GROWI への自己登録 ───────────────────────────────────────────
if (window.pluginActivators == null) {
    window.pluginActivators = {};
}
window.pluginActivators[PLUGIN_NAME] = { activate, deactivate };
