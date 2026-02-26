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
 * サイドバー要素を探す。見つからなければ null を返す。
 */
function findSidebar(): HTMLElement | null {
    for (const selector of SIDEBAR_SELECTORS) {
        const el = document.querySelector<HTMLElement>(selector);
        if (el) {
            console.log(`[FM-DEBUG] sidebar found with selector: "${selector}"`, el); // DEBUG
            return el;
        }
    }
    console.warn(`[FM-DEBUG] sidebar not found with any selector → using fallback`); // DEBUG
    return null;
}

/**
 * 指定した要素の直前（兄弟要素として）にコンテナdivを挿入して返す。
 * target.parentElement が null の場合はフォールバックコンテナを返す。
 */
function ensureContainerBefore(target: HTMLElement): HTMLElement {
    const existing = document.getElementById(CONTAINER_ID);
    if (existing) return existing;

    const parent = target.parentElement;
    if (!parent) {
        console.warn(`[FM-DEBUG] target has no parentElement → using fallback`); // DEBUG
        return ensureFallbackContainer();
    }

    const div = document.createElement('div');
    div.id = CONTAINER_ID;
    parent.insertBefore(div, target);
    return div;
}

/**
 * サイドバーが見つからない場合のフォールバック:
 * 画面右下に固定表示するフローティングパネルとして追加する。
 */
function ensureFallbackContainer(): HTMLElement {
    const existing = document.getElementById(CONTAINER_ID);
    if (existing) return existing;

    const div = document.createElement('div');
    div.id = CONTAINER_ID;
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
        background: '#fff',
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
    console.log(`[FM-DEBUG] mountPanel called, fm.raw:`, fm.raw.slice(0, 80)); // DEBUG
    const sidebar = findSidebar();
    const c = sidebar ? ensureContainerBefore(sidebar) : ensureFallbackContainer();
    container = c;

    console.log(`[FM-DEBUG] container element:`, c); // DEBUG
    if (!root) {
        root = createRoot(c);
    }
    root.render(createElement(FrontMatterPanel, fm));
    console.log(`[FM-DEBUG] root.render() called`); // DEBUG
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
