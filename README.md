# growi-plugin-front-matter-viewer

GROWI のサイドバーに、現在閲覧中のページの **フロントマター** を表示するスクリプトプラグインです。

## 機能

- サイドバーの目次（`#revision-toc`）の直上にパネルを自動挿入
- **表形式（Table）** と **YAML生文字列（YAML）** をボタンで切り替え
- ヘッダー右端の **▼ ボタン** でパネルを折りたたみ／展開
- ネストしたオブジェクト・配列を再帰的なテーブルで表示
- Bootstrap 5 CSS 変数を使用しライト／ダークモードに自動追従
- 編集モードではパネルを自動で非表示

### 対応 YAML 型

| 型 | 表示例 |
|----|--------|
| 文字列・数値 | テキストそのまま |
| 真偽値 | `true` / `false` バッジ |
| null | `null` バッジ |
| 日付 | `2024-01-15` （ISO 形式） |
| 配列（プリミティブ） | `a, b, c` （カンマ区切り） |
| 配列（複合） | インデックス付きネストテーブル |
| オブジェクト（Mapping） | キー／値のネストテーブル |

## インストール

1. このリポジトリをビルドして `dist/assets/client-entry-*.js` を生成する
2. GROWI の管理画面 → **プラグイン** からビルド済みJSファイルを登録する
3. ページを開くとサイドバーにパネルが表示される

## 開発・ビルド

```bash
# 依存パッケージのインストール
npm install

# プロダクションビルド（dist/ に出力）
npm run build

# ウォッチモード（変更を検知して自動ビルド）
npm run build:watch
```

### ディレクトリ構成

```
growi-plugin-front-matter-viewer/
├── client-entry.tsx          # プラグインエントリーポイント（window.pluginActivators 登録）
├── src/
│   ├── growiApi.ts           # GROWI REST API からページ本文を取得
│   ├── frontMatterExtractor.ts  # Markdown からフロントマターを抽出・パース
│   ├── sidebarMount.ts       # React パネルをサイドバー DOM にマウント
│   ├── growiNavigation.ts    # SPA ページ遷移を検知するリスナー
│   ├── pageContext.ts        # ページID・モードの型定義
│   └── components/
│       └── FrontMatterPanel.tsx  # 表示パネル React コンポーネント
├── vite.config.ts
└── package.json
```

## フロントマターの書き方

ページ本文の **先頭** に `---` で囲んだ YAML ブロックを記述します。

```markdown
---
title: サンプルページ
tags:
  - growi
  - plugin
published: true
date: 2024-01-15
---

ここからページ本文...
```

## サイドバー挿入位置のカスタマイズ

GROWI のバージョンによって DOM 構造が変わる場合は `src/sidebarMount.ts` の `SIDEBAR_SELECTORS` を編集してください。

```ts
const SIDEBAR_SELECTORS = [
    '#revision-toc',               // 実機確認済み（優先）
    '[class*="TableOfContents"]',  // フォールバック
    // 必要に応じてセレクタを追加
];
```

サイドバーが見つからない場合は、画面右下にフローティングパネルとして表示されます。

## ライセンス

[MIT](LICENSE) © 2026 jajamaru09

## サードパーティライセンス

ビルド成果物には以下のライブラリが同梱されます。

| ライブラリ | バージョン | ライセンス | 著作権者 |
|-----------|-----------|-----------|---------|
| [yaml](https://github.com/eemeli/yaml) | ^2.5.0 | ISC | Eemeli Aro |
| [react](https://github.com/facebook/react) | ^18.3.0 | MIT | Facebook, Inc. and its affiliates |
| [react-dom](https://github.com/facebook/react) | ^18.3.0 | MIT | Facebook, Inc. and its affiliates |

以下はビルド時のみ使用されるツールです（配布物には含まれません）。

| ツール | バージョン | ライセンス | 著作権者 |
|--------|-----------|-----------|---------|
| [TypeScript](https://github.com/microsoft/TypeScript) | ^5.5.0 | Apache 2.0 | Microsoft Corporation |
| [Vite](https://github.com/vitejs/vite) | ^5.4.0 | MIT | Evan You and Vite contributors |
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | ^4.3.0 | MIT | Evan You and Vite contributors |
| [@growi/pluginkit](https://github.com/weseek/growi) | ^1.1.0 | MIT | GROWI, Inc. |

ISC ライセンスは MIT と互換性のある寛容ライセンスです。Apache 2.0 は MIT との組み合わせで配布可能です。
