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
 * サイドバーとして試みるセレクタの候補リスト（優先度順）。
 * GROWI のバージョンアップで変わる可能性があるため、実際のDOMを確認して調整すること。
 */
const SIDEBAR_SELECTORS = [
    '[data-testid="grw-sidebar-contents-scroll-container"]',
    '[data-testid="grw-side-contents"]',
    '#grw-sidebar-contents',
    '.grw-sidebar-contents-scroll-container',
    '.grw-sidebar',
    '#grw-sidebar',
    ' d-flex flex-column gap-2',
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
 * 指定した親要素内にコンテナdivを確保して返す。
 */
function ensureContainerIn(parent: HTMLElement): HTMLElement {
    const existing = document.getElementById(CONTAINER_ID);
    if (existing) return existing;

    const div = document.createElement('div');
    div.id = CONTAINER_ID;
    parent.appendChild(div);
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
    container = sidebar
        ? ensureContainerIn(sidebar)
        : ensureFallbackContainer();

    console.log(`[FM-DEBUG] container element:`, container); // DEBUG
    if (!root) {
        root = createRoot(container);
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
