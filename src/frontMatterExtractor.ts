/**
 * frontMatterExtractor.ts — Markdown 本文からフロントマターを抽出するユーティリティ
 *
 * フロントマターは文書先頭の "---" と "---" に囲まれたYAMLブロック。
 * yaml パッケージを用いてパースし、構造化データを返す。
 */

import { parse } from 'yaml';

// ─── 型定義 ───────────────────────────────────────────────────────

/** extractFrontMatter の成功時の戻り値 */
export interface FrontMatterResult {
    /** フロントマター部分の生のYAML文字列（"---" を含まない） */
    raw: string;
    /** YAMLをパースしたオブジェクト。パース失敗時は空オブジェクト */
    parsed: Record<string, unknown>;
}

// ─── メイン関数 ───────────────────────────────────────────────────

/**
 * Markdown本文からフロントマターを抽出する。
 *
 * フロントマターが存在しない場合、またはルートがオブジェクトでない場合は null を返す。
 * パースに失敗した場合は raw のみ設定して parsed は空オブジェクトで返す。
 *
 * @param body - ページのMarkdown本文
 * @returns フロントマターの生文字列とパース結果。存在しなければ null
 */
export function extractFrontMatter(body: string): FrontMatterResult | null {
    console.log(`[FM-DEBUG] extractFrontMatter body starts with:`, JSON.stringify(body.slice(0, 100))); // DEBUG

    // 文書の先頭が "---" で始まり、次の "---" で閉じられているブロックを検出する
    const match = body.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    console.log(`[FM-DEBUG] regex match:`, match ? `found (raw="${match[1].slice(0, 80)}")` : 'not found'); // DEBUG
    if (!match) return null;

    const raw = match[1];

    try {
        const parsed = parse(raw);
        console.log(`[FM-DEBUG] yaml parse result type:`, typeof parsed, Array.isArray(parsed) ? '(array)' : ''); // DEBUG
        // フロントマターのルートはキーバリューオブジェクトであることを期待する
        if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
            console.log(`[FM-DEBUG] parsed is not a plain object → return null`); // DEBUG
            return null;
        }
        return { raw, parsed: parsed as Record<string, unknown> };
    } catch (e) {
        console.warn(`[FM-DEBUG] yaml parse error:`, e); // DEBUG
        // YAMLパース失敗時は生文字列だけ返す（表示で使える）
        return { raw, parsed: {} };
    }
}
