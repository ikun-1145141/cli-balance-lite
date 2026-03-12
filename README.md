# CloudCode CLI Proxy

一个基于 Cloudflare Workers 的 CloudCode CLI (Antigravity) API 中转服务。

## 支持的 API

- `POST /v1internal:streamGenerateContent` - 流式生成内容
- `POST /v1internal:generateContent` - 普通生成内容
- `GET /v1internal:fetchAvailableModels` - 获取可用模型
- `POST /v1internal:countTokens` - 计算 Token

## 使用方法

### 1. 部署到 Cloudflare Workers

```bash
npm install
npm run deploy
```

### 2. 配置 CloudCode CLI

将 CloudCode CLI 的 API 地址指向你的 Worker 地址：

```bash
# 设置环境变量或修改配置
export CLOUDCODE_API_URL=https://your-worker.your-subdomain.workers.dev
```

### 3. 使用 API

请求时需要携带 Google OAuth2 Access Token：

```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/v1internal:generateContent \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-2.0-flash",
    "contents": [{
      "role": "user",
      "parts": [{"text": "Hello"}]
    }]
  }'
```

## 环境变量

无需额外配置环境变量，直接使用 Google OAuth2 Token 即可。

## 技术说明

- 目标地址: `https://cloudcode-pa.googleapis.com`
- 自动添加必要的请求头（User-Agent 等）
- 支持 CORS 跨域请求
- 保留向后兼容的 SiliconFlow API 支持

## 许可证

MIT
