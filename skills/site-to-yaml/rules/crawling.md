# Crawling

## 戦略: BFS（幅優先探索）

ルートURLから幅優先でリンクを辿る。深さ優先だと特定パスに深入りしすぎるため BFS を採用。

### 基本フロー

1. `agent-browser open <url>` でページを開く
2. `agent-browser wait --load networkidle` で JS レンダリング完了を待つ
3. `agent-browser eval` で DOM から `<a href>` を全抽出
4. 未訪問の同一オリジン URL をキューに追加
5. 深度上限まで繰り返し

### リンク抽出 JavaScript

```javascript
JSON.stringify(
  Array.from(document.querySelectorAll('a[href]'))
    .map(a => a.href)
    .filter(h => h.startsWith('http'))
)
```

`eval` に渡す際は1行に整形して文字列として渡す。

### 深度制御

`--depth <n>` で最大深度を指定。デフォルト `3`。

- depth=0: ルートURLのみ
- depth=1: ルートから直接リンクされたページまで
- depth=3: 大半のサイトを網羅できる実用値

### 並列制御

`--concurrency <n>` でバッチサイズを指定。デフォルト `3`。

キューから `n` 件ずつ取り出して `Promise.all` で並列処理する。agent-browser は単一デーモンで動くため、過度な並列はボトルネックになる。3〜5 が現実的。

### SPA 対応

`wait --load networkidle` により、クライアントサイドルーティングで生成されるリンクも取得可能。ただし無限スクロールや遅延ロードには未対応。必要に応じて `scroll down` + 再抽出を検討。

### エラーハンドリング

- ページオープン失敗: スキップしてログ出力、クロール続行
- タイムアウト: `AGENT_BROWSER_DEFAULT_TIMEOUT` を調整
- リダイレクト: リダイレクト先URLを正規化して記録
