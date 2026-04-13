/**
 * client-entry.tsx — GROWIスクリプトプラグインのエントリーポイント
 *
 * extension-hub と連携し、ページ遷移検知・API・ログ・ON/OFF制御を hub に委譲する。
 */

import { extractFrontMatter } from './src/frontMatterExtractor';
import { mountPanel, unmountPanel } from './src/sidebarMount';

// ─── グローバル型宣言 ──────────────────────────────────────────────
declare global {
  interface Window {
    pluginActivators?: Record<string, { activate(): void; deactivate(): void }>;
    growiPluginHub?: any;
  }
}

// ─── 定数 ────────────────────────────────────────────────────────
const PLUGIN_NAME = 'growi-plugin-front-matter-viewer' as const;

// ─── hub 登録ユーティリティ ──────────────────────────────────────
function registerToHub(plugin: any): void {
  const hub = window.growiPluginHub;
  if (hub?.register) {
    hub.register(plugin);
  } else {
    window.growiPluginHub ??= { _queue: [] } as any;
    (window.growiPluginHub as any)._queue.push(plugin);
  }
}

// ─── ページ遷移ハンドラ ───────────────────────────────────────────
async function handlePageChange(ctx: {
  pageId: string;
  mode: 'view' | 'edit';
  revisionId?: string;
}): Promise<void> {
  // hub は onPageChange を呼ぶ側なので必ず存在する
  const hub = window.growiPluginHub;
  if (!hub || !hub.api) return;

  // 編集モードではパネルを非表示にする
  if (ctx.mode === 'edit') {
    hub.log(PLUGIN_NAME, 'edit mode, unmounting panel');
    unmountPanel();
    return;
  }

  hub.log(PLUGIN_NAME, 'page changed:', ctx.pageId, 'revisionId:', ctx.revisionId ?? '(latest)');

  try {
    let body: string | null = null;

    if (ctx.revisionId) {
      // 過去リビジョン
      const revision = await hub.api.fetchRevision(ctx.revisionId, ctx.pageId);
      body = revision?.body ?? null;
      hub.log(PLUGIN_NAME, 'fetchRevision result:', body ? `${body.length} chars` : 'null');
    } else {
      // 最新版
      const pageInfo = await hub.api.fetchPageInfo(ctx.pageId);
      body = pageInfo?.revision?.body ?? null;
      hub.log(PLUGIN_NAME, 'fetchPageInfo result:', body ? `${body.length} chars` : 'null');
    }

    if (!body) {
      unmountPanel();
      return;
    }

    const fm = extractFrontMatter(body);
    if (!fm) {
      hub.log(PLUGIN_NAME, 'no front matter found');
      unmountPanel();
      return;
    }

    hub.log(PLUGIN_NAME, 'front matter keys:', Object.keys(fm.parsed));
    mountPanel(fm);
  } catch (e) {
    hub.log(PLUGIN_NAME, 'error:', e);
    unmountPanel();
  }
}

// ─── プラグインライフサイクル ─────────────────────────────────────
function activate(): void {
  registerToHub({
    id: PLUGIN_NAME,
    label: 'Front Matter Viewer',
    menuItem: false,
    onPageChange: handlePageChange,
    onDisable: () => {
      unmountPanel();
    },
  });
}

function deactivate(): void {
  unmountPanel();
  window.growiPluginHub?.unregister(PLUGIN_NAME);
}

// ─── GROWI への自己登録 ───────────────────────────────────────────
if (window.pluginActivators == null) {
  window.pluginActivators = {};
}
window.pluginActivators[PLUGIN_NAME] = { activate, deactivate };
