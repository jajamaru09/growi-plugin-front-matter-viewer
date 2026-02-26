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
    parsed: Record<string, unknown>;
}

// ─── スタイル定数 ─────────────────────────────────────────────────

const S = {
    panel: {
        margin: '8px 0',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'inherit',
        overflow: 'hidden',
    } as React.CSSProperties,

    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        background: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
    } as React.CSSProperties,

    title: {
        fontWeight: 'bold',
        fontSize: '11px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        color: '#6c757d',
    } as React.CSSProperties,

    toggleGroup: {
        display: 'flex',
        gap: '2px',
    } as React.CSSProperties,

    btn: (active: boolean): React.CSSProperties => ({
        padding: '2px 8px',
        fontSize: '11px',
        border: '1px solid #ced4da',
        borderRadius: '3px',
        cursor: 'pointer',
        background: active ? '#0d6efd' : '#fff',
        color: active ? '#fff' : '#495057',
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
        color: '#495057',
        whiteSpace: 'nowrap' as const,
        fontWeight: 'normal',
        borderBottom: '1px solid #e9ecef',
        width: '35%',
    } as React.CSSProperties,

    td: {
        padding: '3px 6px',
        verticalAlign: 'top',
        borderBottom: '1px solid #e9ecef',
        wordBreak: 'break-all' as const,
    } as React.CSSProperties,

    pre: {
        margin: 0,
        padding: '4px',
        fontSize: '11px',
        background: '#f8f9fa',
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
        background: '#e9ecef',
        color: '#6c757d',
    } as React.CSSProperties,
};

// ─── 値のレンダリング（再帰） ─────────────────────────────────────

/**
 * 任意のYAML値を React ノードに変換する。
 * オブジェクト・配列はネストしたテーブルで表示する。
 */
function renderValue(value: unknown, depth = 0): React.ReactNode {
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
        return String(value);
    }

    // 配列
    if (Array.isArray(value)) {
        if (value.length === 0) return <span style={S.badge}>[]</span>;

        // すべてプリミティブなら1行で表示
        const allPrimitive = value.every(
            (v) => v === null || (typeof v !== 'object' && !(v instanceof Date)),
        );
        if (allPrimitive) {
            return value.map(String).join(', ');
        }

        // 複雑な要素があればネストしたテーブル
        return (
            <table style={S.table}>
                <tbody>
                    {value.map((item, i) => (
                        <tr key={i}>
                            <th style={{ ...S.th, width: '20px', color: '#adb5bd' }}>{i}</th>
                            <td style={S.td}>{renderValue(item, depth + 1)}</td>
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
                        <td style={S.td}>{renderValue(v, depth + 1)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

// ─── メインコンポーネント ─────────────────────────────────────────

export function FrontMatterPanel({ raw, parsed }: Props) {
    const [mode, setMode] = useState<ViewMode>('table');
    const hasTable = Object.keys(parsed).length > 0;

    return (
        <div style={S.panel}>
            {/* ヘッダー */}
            <div style={S.header}>
                <span style={S.title}>Front Matter</span>
                <div style={S.toggleGroup}>
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
                </div>
            </div>

            {/* 本文 */}
            <div style={S.body}>
                {mode === 'table' ? (
                    hasTable ? (
                        <table style={S.table}>
                            <tbody>
                                {Object.entries(parsed).map(([key, value]) => (
                                    <tr key={key}>
                                        <th style={S.th}>{key}</th>
                                        <td style={S.td}>{renderValue(value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        // パース失敗時はYAML生文字列を表示
                        <pre style={S.pre}>{raw}</pre>
                    )
                ) : (
                    <pre style={S.pre}>{raw}</pre>
                )}
            </div>
        </div>
    );
}
