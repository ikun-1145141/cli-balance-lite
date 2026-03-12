//Author: PublicAffairs (Original Gemini version)
//Modified for: SiliconFlow API Proxy
//Project: https://github.com/ikun-11451/siliconflow-balance-lite

export default {
  async fetch (request) {
    if (request.method === "OPTIONS") {
      return handleOPTIONS();
    }
    const errHandler = (err) => {
      console.error(err);
      return new Response(err.message, fixCors({ status: err.status ?? 500 }));
    };
    try {
      const auth = request.headers.get("Authorization");
      let apiKey = auth?.replace(/^Bearer\s+/i, '');
      if (apiKey && apiKey.includes(',')) {
        const apiKeys = apiKey.split(',').map(k => k.trim()).filter(k => k);
        apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
        console.log(`SiliconFlow Selected API Key: ${apiKey}`);
      }
      
      const assert = (success) => {
        if (!success) {
          throw new HttpError("The specified HTTP method is not allowed for the requested resource", 400);
        }
      };
      const { pathname } = new URL(request.url);
      switch (true) {
        case pathname.endsWith("/chat/completions"):
          assert(request.method === "POST");
          return handleCompletions(await request.json(), apiKey)
            .catch(errHandler);
        case pathname.endsWith("/embeddings"):
          assert(request.method === "POST");
          return handleEmbeddings(await request.json(), apiKey)
            .catch(errHandler);
        case pathname.endsWith("/models"):
          assert(request.method === "GET");
          return handleModels(apiKey)
            .catch(errHandler);
        default:
          throw new HttpError("404 Not Found", 404);
      }
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
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
    }
  });
};

const BASE_URL = "https://api.siliconflow.cn";
const API_VERSION = "v1";

const makeHeaders = (apiKey, more) => ({
  ...(apiKey && { "Authorization": `Bearer ${apiKey}` }),
  ...more
});

async function handleModels (apiKey) {
  const response = await fetch(`${BASE_URL}/${API_VERSION}/models`, {
    headers: makeHeaders(apiKey),
  });
  let { body } = response;
  return new Response(body, fixCors(response));
}

const DEFAULT_EMBEDDINGS_MODEL = "BAAI/bge-large-zh-v1.5";
async function handleEmbeddings (req, apiKey) {
  if (typeof req.model !== "string") {
    req.model = DEFAULT_EMBEDDINGS_MODEL;
  }
  // SiliconFlow使用OpenAI兼容格式，直接转发
  const response = await fetch(`${BASE_URL}/${API_VERSION}/embeddings`, {
    method: "POST",
    headers: makeHeaders(apiKey, { "Content-Type": "application/json" }),
    body: JSON.stringify(req)
  });
  return new Response(response.body, fixCors(response));
}

const DEFAULT_MODEL = "Qwen/Qwen2.5-7B-Instruct";
async function handleCompletions (req, apiKey) {
  if (typeof req.model !== "string" || !req.model) {
    req.model = DEFAULT_MODEL;
  }
  // SiliconFlow使用OpenAI兼容格式，直接转发
  const response = await fetch(`${BASE_URL}/${API_VERSION}/chat/completions`, {
    method: "POST",
    headers: makeHeaders(apiKey, { "Content-Type": "application/json" }),
    body: JSON.stringify(req),
  });
  return new Response(response.body, fixCors(response));
}
