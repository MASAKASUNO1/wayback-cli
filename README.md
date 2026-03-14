# wayback-cli

URL リストを Wayback Machine に一括登録する CLI ツール。

## Setup

```bash
bun install
```

### API Key

Wayback Machine への登録には Internet Archive の S3 API Key が必要です。

1. https://archive.org/account/signup でアカウント作成（既にあればスキップ）
2. https://archive.org/account/s3.php で **Access Key** と **Secret Key** を取得
3. `.env` に記載:

```
WAYBACK_ACCESS_KEY=your_access_key
WAYBACK_SECRET_KEY=your_secret_key
```

## Usage

```bash
# ドライラン
bun run index.ts --dry-run urls.yaml

# 登録（完了まで待つ）
bun run index.ts urls.yaml

# 送信のみ（完了を待たない）
bun run index.ts --no-wait urls.yaml

# 並列数を変更
bun run index.ts -c 5 urls.yaml
```

### 入力形式

YAML:

```yaml
urls:
  - https://example.com
  - https://example.com/about
```

CSV（1行1URL）:

```
https://example.com
https://example.com/about
```

## サイトクロールから YAML 生成

[agent-browser](https://github.com/vercel-labs/agent-browser) を使ってサイトを巡回し、URL リストを自動生成できます。

```bash
npm install -g agent-browser && agent-browser install
bun run skills/site-to-yaml/scripts/crawl.ts https://example.com -o urls.yaml
bun run index.ts urls.yaml
```
