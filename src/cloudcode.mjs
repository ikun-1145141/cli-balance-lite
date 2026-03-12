// CloudCode CLI (Antigravity) API Proxy
// 支持 Google CloudCode CLI 的 API 中转

const CLOUDCODE_BASE_URL = "https://cloudcode-pa.googleapis.com";

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return handleOPTIONS();
    }
    
    const errHandler = (err) => {
      console.error(err);
      return new Response(err.message, fixCors({ status: err.status ?? 500 }));
    };
    
    try {
      const auth = request.headers.get("Authorization");
      let accessToken = auth?.replace(/^Bearer\s+/i, '');
      
      if (!accessToken) {
        throw new HttpError("Missing Authorization header", 401);
      }

      const { pathname, search } = new URL(request.url);
      
      // 构建目标 URL
      const targetUrl = `${CLOUDCODE_BASE_URL}${pathname}${search}`;
      
      console.log(`CloudCode Request: ${pathname}`);
      console.log(`Target URL: ${targetUrl}`);

      // 复制并修改请求头
      const headers = new Headers();
      
      // 设置必要的请求头
      headers.set("Authorization", `Bearer ${accessToken}`);
      headers.set("User-Agent", "antigravity/1.19.6 darwin/arm64");
      headers.set("Accept", "application/json");
      headers.set("Accept-Language", "en-US,en;q=0.9");
      
      // 注意：不要手动设置 Accept-Encoding，让 fetch 自动处理压缩
      
      // 保留原始请求中的 Content-Type
      const contentType = request.headers.get("Content-Type");
      if (contentType) {
        headers.set("Content-Type", contentType);
      }

      // 转发请求到 CloudCode API
      const fetchOptions = {
        method: request.method,
        headers: headers,
      };

      // 对于 POST/PUT/PATCH 请求，转发 body
      if (["POST", "PUT", "PATCH"].includes(request.method)) {
        fetchOptions.body = request.body;
      }

      console.log("Forwarding request to CloudCode API...");
      
      // 使用 redirect: 'manual' 避免自动跟随重定向，并确保正确处理响应
      const response = await fetch(targetUrl, {
        ...fetchOptions,
        redirect: 'manual'
      });
      
      console.log(`CloudCode Response Status: ${response.status}`);

      // 构建响应头
      const responseHeaders = new Headers(response.headers);
      
      // 删除可能导致问题的头
      responseHeaders.delete('transfer-encoding');
      responseHeaders.delete('connection');
      responseHeaders.delete('keep-alive');
      
      // 添加 CORS 头
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      responseHeaders.set("Access-Control-Allow-Headers", "*");

      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders
      });

    } catch (err) {
      return errHandler(err);
    }
  }
};

class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}

const fixCors = ({ headers, status, statusText }) => {
  headers = new Headers(headers);
  headers.set("Access-Control-Allow-Origin", "*");
  return { headers, status, statusText };
};

const handleOPTIONS = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400",
    }
  });
};
