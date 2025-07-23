# 障害年金管理システム API ドキュメント

## 概要

障害年金管理システムのREST API仕様書です。

## ベースURL

```
http://localhost:5000/api
```

## 認証

APIは JWT (JSON Web Token) を使用した Bearer 認証を採用しています。

### リクエストヘッダー
```
Authorization: Bearer <token>
```

## レスポンス形式

### 成功レスポンス
```json
{
  "data": {...},
  "message": "成功メッセージ"
}
```

### エラーレスポンス
```json
{
  "error": "エラーメッセージ",
  "errors": [
    {
      "field": "フィールド名",
      "message": "詳細なエラーメッセージ"
    }
  ]
}
```

## エンドポイント一覧

### 認証

#### POST /auth/register
新規ユーザー登録

**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "ユーザー名",
  "role": "staff"
}
```

#### POST /auth/login
ログイン

**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "ユーザー名",
    "role": "staff"
  },
  "token": "jwt_token_here"
}
```

### 申請管理

#### GET /applications
申請一覧取得

**クエリパラメータ:**
- `page`: ページ番号 (デフォルト: 1)
- `limit`: 1ページあたりの件数 (デフォルト: 20)
- `status`: ステータスフィルタ
- `search`: 検索キーワード

#### POST /applications
新規申請作成

**リクエスト:**
```json
{
  "applicantName": "申請者名",
  "applicantNameKana": "申請者名（カナ）",
  "birthDate": "1990-01-01",
  "gender": "male",
  "disabilityType": "physical",
  "applicationType": "new"
}
```

## ステータス一覧

### 申請ステータス
- `draft`: 下書き
- `submitted`: 提出済み
- `under_review`: 審査中
- `additional_docs_required`: 追加書類必要
- `approved`: 承認済み
- `rejected`: 却下
- `withdrawn`: 取り下げ

### 障害種別
- `physical`: 身体障害
- `mental`: 精神障害
- `intellectual`: 知的障害
- `multiple`: 重複障害

### ユーザーロール
- `admin`: 管理者
- `staff`: 職員
- `viewer`: 閲覧者

## エラーコード

- `400`: Bad Request - リクエストが無効
- `401`: Unauthorized - 認証が必要
- `403`: Forbidden - 権限不足
- `404`: Not Found - リソースが見つからない
- `422`: Unprocessable Entity - バリデーションエラー
- `500`: Internal Server Error - サーバーエラー

## テスト環境

### テストアカウント
- **管理者**: admin@disability-pension.jp / admin123
- **職員**: staff1@disability-pension.jp / staff123
- **閲覧者**: viewer@disability-pension.jp / viewer123

### Postmanコレクション
API テスト用のPostmanコレクションは `docs/api/postman-collection.json` にあります。