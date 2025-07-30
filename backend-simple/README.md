# シンプルバックエンド定義

このディレクトリには、UIと動的データの定義のみが含まれています。

## 構造

```
backend-simple/
├── models/
│   └── data-definitions.js  # データモデル定義
├── api/
│   └── endpoints.js         # APIエンドポイント定義
└── README.md               # このファイル
```

## 使用方法

### データ定義の参照

```javascript
const dataDefinitions = require('./models/data-definitions');

// 例: Application モデルの構造を確認
console.log(dataDefinitions.Application);
```

### API定義の参照

```javascript
const apiEndpoints = require('./api/endpoints');

// 例: 申請書関連のAPIエンドポイントを確認
console.log(apiEndpoints.applications);
```

## 改修時の注意点

1. **データ定義の変更**
   - `models/data-definitions.js` を編集
   - 新しいフィールドを追加する際は、既存のデータとの互換性を考慮

2. **API定義の変更**
   - `api/endpoints.js` を編集
   - RESTfulな設計を維持
   - レスポンス形式の一貫性を保つ

3. **実装への展開**
   - これらの定義を基に、実際のバックエンドコードを生成可能
   - ORMやAPIフレームワークの選択は自由

## データ型の説明

- `INTEGER`: 整数
- `STRING(n)`: 最大n文字の文字列
- `TEXT`: 長いテキスト
- `DATE`: 日付のみ
- `DATETIME`: 日付と時刻
- `BOOLEAN`: 真偽値
- `ENUM`: 列挙型（定義された値のみ）
- `JSON`: JSON形式のデータ

## APIレスポンス形式

- 成功時: `{ data: {...}, message?: string }`
- エラー時: `{ error: string, details?: any }`
- ページネーション: `{ data: [...], total: number, page: number, totalPages: number }`