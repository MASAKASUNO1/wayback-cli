# URL Filtering

## 同一オリジンチェック

`new URL(href).origin` でルートURLと比較。外部リンクは除外。

## 正規化

収集したURLは以下のルールで正規化する:

- フラグメント (`#section`) を除去
- 末尾スラッシュを統一（ルート `/` 以外は除去）
- `URL` コンストラクタで正規化

```typescript
function normalizeUrl(url: string): string {
  const u = new URL(url);
  u.hash = "";
  if (u.pathname !== "/" && u.pathname.endsWith("/")) {
    u.pathname = u.pathname.slice(0, -1);
  }
  return u.toString();
}
```

## 静的アセット除外

以下の拡張子を持つURLはページではないため除外:

```
png, jpg, jpeg, gif, svg, ico, css, js, woff, woff2, ttf, eot, pdf, zip, tar, gz
```

## パターンフィルタ

- `--include <pattern>`: マッチするURLのみ含める
- `--exclude <pattern>`: マッチするURLを除外

パターンは簡易 glob（`*` → `.*`, `?` → `.`）で正規表現に変換。

### 使用例

```bash
# /blog/ 配下のみ収集
--include "*/blog/*"

# 管理画面を除外
--exclude "*/admin/*"

# 複数パターン
--include "*/docs/*" --exclude "*/docs/internal/*"
```

## 重複排除

`Set<string>` で訪問済みURLを管理。正規化後のURLで比較するため、`https://example.com/page` と `https://example.com/page/` は同一と見なす。
