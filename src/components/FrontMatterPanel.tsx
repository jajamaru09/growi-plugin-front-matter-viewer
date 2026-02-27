/**
 * FrontMatterPanel.tsx — フロントマターを表示するサイドバーパネルコンポーネント
 *
 * 「表形式」と「YAML形式」をトグルボタンで切り替えられる。
 * 表形式はネストした構造も再帰的にレンダリングする。
 */

import React, { useState } from 'react';

// ─── 型定義 ───────────────────────────────────────────────────────

type ViewMode = 'table' | 'yaml';

interface Props {
    raw: string;
    parsed: Record<string, unknown> | unknown[];
}

// ─── スタイル定数 ─────────────────────────────────────────────────

// ハードコードの色値は使用せず、GROWIが提供する Bootstrap 5 CSS 変数を参照する。
// data-bs-theme 属性の切り替えだけでライト/ダークモードに自動追従する。

/** btn / chevron で共通するベーススタイル */
const BASE_BTN: React.CSSProperties = {
    fontSize: '11px',
    border: '1px solid var(--bs-border-color)',
    borderRadius: '3px',
    cursor: 'pointer',
};

const S = {
    panel: {
        margin: '8px 0',
        border: '1px solid var(--bs-border-color)',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'inherit',
        overflow: 'hidden',
        background: 'var(--bs-body-bg)',
        color: 'var(--bs-body-color)',
    } as React.CSSProperties,

    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        background: 'var(--bs-tertiary-bg)',
        borderBottom: '1px solid var(--bs-border-color)',
    } as React.CSSProperties,

    title: {
        fontWeight: 'bold',
        fontSize: '11px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        color: 'var(--bs-secondary-color)',
    } as React.CSSProperties,

    toggleGroup: {
        display: 'flex',
        gap: '2px',
    } as React.CSSProperties,

    btn: (active: boolean): React.CSSProperties => ({
        ...BASE_BTN,
        padding: '2px 8px',
        background: active ? 'var(--bs-primary-border-subtle)' : 'var(--bs-btn-bg)',
        color: active ? 'var(--bs-btn-active-color)' : 'var(--bs-btn-color)',
    }),

    chevron: (collapsed: boolean): React.CSSProperties => ({
        ...BASE_BTN,
        padding: '2px 6px',
        background: 'var(--bs-btn-bg)',
        color: 'var(--bs-btn-color)',
        lineHeight: 1,
        transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease',
    }),

    body: {
        padding: '8px',
        maxHeight: '400px',
        overflowY: 'auto',
    } as React.CSSProperties,

    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
    } as React.CSSProperties,

    th: {
        padding: '3px 6px',
        textAlign: 'left' as const,
        verticalAlign: 'top',
        color: 'var(--bs-secondary-color)',
        whiteSpace: 'nowrap' as const,
        fontWeight: 'normal',
        borderBottom: '1px solid var(--bs-border-color)',
        width: '35%',
    } as React.CSSProperties,

    td: {
        padding: '3px 6px',
        verticalAlign: 'top',
        borderBottom: '1px solid var(--bs-border-color)',
        wordBreak: 'break-all' as const,
    } as React.CSSProperties,

    pre: {
        margin: 0,
        padding: '4px',
        fontSize: '11px',
        background: 'var(--bs-tertiary-bg)',
        color: 'var(--bs-body-color)',
        borderRadius: '3px',
        overflowX: 'auto',
        whiteSpace: 'pre-wrap' as const,
        wordBreak: 'break-all' as const,
    } as React.CSSProperties,

    badge: {
        display: 'inline-block',
        padding: '1px 5px',
        borderRadius: '10px',
        fontSize: '10px',
        background: 'var(--bs-secondary-bg)',
        color: 'var(--bs-secondary-color)',
    } as React.CSSProperties,

    link: {
        color: 'rgba(var(--grw-wiki-link-color-rgb, var(--bs-link-color-rgb)), var(--bs-link-opacity, 1))',
        textDecorationColor: 'rgba(var(--grw-wiki-link-color-rgb, var(--bs-link-color-rgb)), var(--bs-link-underline-opacity, 1))',
        WebkitTextDecorationColor: 'rgba(var(--grw-wiki-link-color-rgb, var(--bs-link-color-rgb)), var(--bs-link-underline-opacity, 1))',
    } as React.CSSProperties,
};

// ─── ヘルパー ─────────────────────────────────────────────────────

/**
 * null・string・number・boolean をプリミティブと見なす。
 * Date やオブジェクトは object なので false を返す。
 */
const isPrimitive = (v: unknown): boolean => v === null || typeof v !== 'object';

const URL_RE = /https?:\/\/[^\s,<>"']+/g;

/**
 * テキストをパースして URL 部分を <a> タグに変換した React ノード配列を返す。
 * URL が含まれない場合は文字列をそのまま返す。
 */
function linkify(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let last = 0;
    let match: RegExpExecArray | null;
    URL_RE.lastIndex = 0;
    while ((match = URL_RE.exec(text)) !== null) {
        if (match.index > last) {
            parts.push(text.slice(last, match.index));
        }
        const url = match[0];
        parts.push(
            <a key={match.index} href={url} target="_blank" rel="noopener noreferrer" style={S.link}>
                {url}
            </a>
        );
        last = match.index + url.length;
    }
    if (parts.length === 0) return text;
    if (last < text.length) parts.push(text.slice(last));
    return <>{parts}</>;
}

// ─── 値のレンダリング（再帰） ─────────────────────────────────────

/**
 * 任意のYAML値を React ノードに変換する。
 * オブジェクト・配列はネストしたテーブルで表示する。
 */
function renderValue(value: unknown): React.ReactNode {
    // null
    if (value === null) {
        return <span style={S.badge}>null</span>;
    }

    // Date（yamlパッケージは日付をDateオブジェクトに変換する）
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }

    // boolean
    if (typeof value === 'boolean') {
        return <span style={S.badge}>{value ? 'true' : 'false'}</span>;
    }

    // number / string（プリミティブ）
    if (typeof value !== 'object') {
        return linkify(String(value));
    }

    // 配列
    if (Array.isArray(value)) {
        if (value.length === 0) return <span style={S.badge}>[]</span>;

        // すべてプリミティブなら1行で表示（Date は inline 表示が不自然なためネストにする）
        if (value.every(isPrimitive)) {
            const text = value.map(String).join(', ');
            return linkify(text);
        }

        // 複雑な要素があればネストしたテーブル
        return (
            <table style={S.table}>
                <tbody>
                    {value.map((item, i) => (
                        <tr key={i}>
                            <th style={{ ...S.th, width: '20px' }}>{i}</th>
                            <td style={S.td}>{renderValue(item)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    // オブジェクト（Mapping）
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span style={S.badge}>{'{}'}</span>;

    return (
        <table style={S.table}>
            <tbody>
                {entries.map(([k, v]) => (
                    <tr key={k}>
                        <th style={S.th}>{k}</th>
                        <td style={S.td}>{renderValue(v)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

// ─── メインコンポーネント ─────────────────────────────────────────

export function FrontMatterPanel({ raw, parsed }: Props) {
    const [mode, setMode] = useState<ViewMode>('table');
    const [collapsed, setCollapsed] = useState(false);
    const hasEntries = Array.isArray(parsed)
        ? parsed.length > 0
        : Object.keys(parsed).length > 0;

    return (
        <div style={S.panel}>
            {/* ヘッダー */}
            <div style={S.header}>
                <span style={S.title}>Front Matter</span>
                <div style={S.toggleGroup}>
                    {!collapsed && (
                        <>
                            <button
                                style={S.btn(mode === 'table')}
                                onClick={() => setMode('table')}
                            >
                                Table
                            </button>
                            <button
                                style={S.btn(mode === 'yaml')}
                                onClick={() => setMode('yaml')}
                            >
                                YAML
                            </button>
                        </>
                    )}
                    <button
                        style={S.chevron(collapsed)}
                        onClick={() => setCollapsed((c) => !c)}
                        title={collapsed ? '展開' : '折りたたむ'}
                    >
                        ▼
                    </button>
                </div>
            </div>

            {/* 本文 */}
            {!collapsed && (
                <div style={S.body}>
                    {mode === 'table' ? (
                        hasEntries ? (
                            renderValue(parsed)
                        ) : (
                            // パース失敗時はYAML生文字列を表示
                            <pre style={S.pre}>{raw}</pre>
                        )
                    ) : (
                        <pre style={S.pre}>{raw}</pre>
                    )}
                </div>
            )}
        </div>
    );
}
