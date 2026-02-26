/**
 * sidebarMount.ts — GROWI サイドバーへの React パネルのマウント管理
 *
 * ## サイドバーのマウントポイントについて
 *
 * GROWIのDOM上の正確なセレクタはバージョンや設定によって異なる。
 * 実際のセレクタを確認するには:
 *   1. Chrome DevTools (F12) → Elements タブを開く
 *   2. サイドバーが見えている状態で Ctrl+Shift+C で要素を選択
 *   3. 一意な id や data-testid 属性を探す
 *   4. Console で `document.querySelector('確認したセレクタ')` で検証する
 *
 * 現在 SIDEBAR_SELECTORS に代表的な候補を列挙している。
 * 見つからない場合は画面右下にフローティングパネルとして表示するフォールバックが動作する。
 */

import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FrontMatterPanel } from './components/FrontMatterPanel';
import type { FrontMatterResult } from './frontMatterExtractor';

// ─── 定数 ────────────────────────────────────────────────────────

const CONTAINER_ID = 'growi-plugin-front-matter-viewer-container';

/**
 * 挿入基準となる要素のセレクタ候補（優先度順）。
 * 見つかった要素の「直前（兄弟）」にコンテナを挿入する。
 * GROWI のバージョンアップで変わる可能性があるため実機DOMで確認すること。
 */
const SIDEBAR_SELECTORS = [
    '#revision-toc',                  // 実機確認済み（優先）
    '[class*="TableOfContents"]',     // クラス名にハッシュが付く場合のフォールバック
    '[data-testid="grw-sidebar-contents-scroll-container"]',
    '[data-testid="grw-side-contents"]',
    '#grw-sidebar-contents',
    '.grw-sidebar-contents-scroll-container',
];

// ─── モジュールスコープ状態 ───────────────────────────────────────

let root: Root | null = null;
let container: HTMLElement | null = null;

// ─── 内部ユーティリティ ───────────────────────────────────────────

/**
 * コンテナdivを取得または作成して返す。
 * - すでに存在する場合はそれを返す（getElementById で判定）
 * - サイドバーが見つかれば直前（兄弟）に挿入する
 * - 見つからなければ画面右下にフローティングパネルとして追加する
 */
function ensureContainer(): HTMLElement {
    const existing = document.getElementById(CONTAINER_ID);
    if (existing) return existing;

    const div = document.createElement('div');
    div.id = CONTAINER_ID;

    const sidebar = SIDEBAR_SELECTORS.reduce<HTMLElement | null>(
        (found, sel) => found ?? document.querySelector<HTMLElement>(sel),
        null,
    );
    const parent = sidebar?.parentElement;
    if (parent) {
        parent.insertBefore(div, sidebar);
        return div;
    }

    // フォールバック: 画面右下に固定表示
    Object.assign(div.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '320px',
        maxHeight: '80vh',
        overflowY: 'auto',
        zIndex: '9999',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        borderRadius: '4px',
        background: 'var(--bs-body-bg)',
        border: '1px solid var(--bs-border-color)',
    });
    document.body.appendChild(div);
    return div;
}

// ─── 公開 API ────────────────────────────────────────────────────

/**
 * フロントマターパネルをサイドバー（またはフォールバック位置）にマウントする。
 * すでにマウント済みの場合は内容を更新する。
 */
export function mountPanel(fm: FrontMatterResult): void {
    const c = ensureContainer();
    container = c;

    if (!root) {
        root = createRoot(c);
    }
    root.render(createElement(FrontMatterPanel, fm));
}

/**
 * パネルをアンマウントしてDOMから除去する。
 */
export function unmountPanel(): void {
    if (root) {
        root.unmount();
        root = null;
    }
    if (container) {
        container.remove();
        container = null;
    }
}
