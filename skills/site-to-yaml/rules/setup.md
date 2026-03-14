# Setup

## agent-browser

Rust製のヘッドレスブラウザCLI。AI エージェント向けに最適化されている。

### インストール

```bash
npm install -g agent-browser
agent-browser install
```

`agent-browser install` で Chrome for Testing がダウンロードされる。

### 動作確認

```bash
agent-browser open https://example.com
agent-browser snapshot
```

`snapshot` でアクセシビリティツリーが返れば準備完了。

### 主要コマンド

| コマンド | 用途 |
|---------|------|
| `open <url>` | ページを開く |
| `snapshot` | AXツリー取得（`@e1` 等の ref 付き） |
| `eval <js>` | JavaScript 実行 |
| `wait --load networkidle` | ネットワーク安定まで待機 |
| `click <ref>` | 要素クリック |

### 環境変数

| 変数 | 説明 |
|------|------|
| `AGENT_BROWSER_SESSION` | セッション分離 |
| `AGENT_BROWSER_HEADED` | ブラウザ表示（デバッグ用） |
| `AGENT_BROWSER_DEFAULT_TIMEOUT` | タイムアウトms（default: 25000） |
