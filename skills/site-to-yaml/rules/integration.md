# Integration with wayback-cli

## 基本フロー

```bash
# 1. サイトをクロールして YAML 生成
bun run skills/site-to-yaml/scripts/crawl.ts https://example.com -o site.yaml

# 2. 内容確認（ドライラン）
bun run index.ts --dry-run site.yaml

# 3. Wayback Machine に登録
bun run index.ts site.yaml
```

## 環境変数

wayback-cli の実行には Internet Archive の S3 API キーが必要:

```bash
export WAYBACK_ACCESS_KEY=your_access_key
export WAYBACK_SECRET_KEY=your_secret_key
```

キーは https://archive.org/account/s3.php から取得。

## 大規模サイト

URL数が多い場合は concurrency を下げてレートリミットを回避:

```bash
bun run index.ts -c 1 site.yaml
```
