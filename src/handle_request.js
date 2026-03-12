import { handleVerification } from './verify_keys.js';
import openai from './openai.mjs';
import cloudcode from './cloudcode.mjs';
import { imageBase64 } from './image.js';

export async function handleRequest(request) {

  const url = new URL(request.url);
  const pathname = url.pathname;
  const search = url.search;

  if (pathname === '/' || pathname === '/index.html') {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudCode CLI Proxy</title>
    <style>
        :root {
            --bg-color: #f0f2f5;
            --container-bg: white;
            --text-color: #333;
            --h1-color: #2c3e50;
            --footer-color: #666;
            --link-color: #007bff;
            --shadow-color: rgba(0, 0, 0, 0.1);
        }

        @media (prefers-color-scheme: dark) {
            :root:not([data-theme="light"]) {
                --bg-color: #121212;
                --container-bg: #1e1e1e;
                --text-color: #e0e0e0;
                --h1-color: #ffffff;
                --footer-color: #aaaaaa;
                --link-color: #4dabf7;
                --shadow-color: rgba(0, 0, 0, 0.5);
            }
        }

        :root[data-theme="dark"] {
            --bg-color: #121212;
            --container-bg: #1e1e1e;
            --text-color: #e0e0e0;
            --h1-color: #ffffff;
            --footer-color: #aaaaaa;
            --link-color: #4dabf7;
            --shadow-color: rgba(0, 0, 0, 0.5);
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--bg-color);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            color: var(--text-color);
            transition: background-color 0.3s, color 0.3s;
        }
        .container {
            background: var(--container-bg);
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 4px 6px var(--shadow-color);
            text-align: center;
            max-width: 500px;
            width: 90%;
            transition: background-color 0.3s, box-shadow 0.3s;
        }
        img {
            max-width: 100%;
            height: auto;
            margin-bottom: 1.5rem;
        }
        h1 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: var(--h1-color);
            transition: color 0.3s;
        }
        p {
            margin-bottom: 1rem;
            line-height: 1.5;
        }
        .footer {
            margin-top: 1.5rem;
            font-size: 0.9rem;
            color: var(--footer-color);
            transition: color 0.3s;
        }
        a {
            color: var(--link-color);
            text-decoration: none;
            transition: color 0.3s;
        }
        a:hover {
            text-decoration: underline;
        }

        .theme-toggle {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--container-bg);
            border: 1px solid var(--shadow-color);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 5px var(--shadow-color);
            transition: all 0.3s;
            color: var(--text-color);
            z-index: 1000;
        }
        .theme-toggle:hover {
            transform: scale(1.1);
        }
        .theme-toggle svg {
            width: 20px;
            height: 20px;
            fill: currentColor;
        }
        
        .icon-sun { display: none; }
        .icon-moon { display: block; }
        
        @media (prefers-color-scheme: dark) {
            :root:not([data-theme="light"]) .icon-sun { display: block; }
            :root:not([data-theme="light"]) .icon-moon { display: none; }
        }
        
        :root[data-theme="dark"] .icon-sun { display: block; }
        :root[data-theme="dark"] .icon-moon { display: none; }

        .api-info {
            background: var(--bg-color);
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            font-family: monospace;
            font-size: 0.85rem;
            text-align: left;
            overflow-x: auto;
        }
        .api-info code {
            color: var(--link-color);
        }
    </style>
</head>
<body>
    <button class="theme-toggle" id="theme-toggle" aria-label="切换主题">
        <svg class="icon-sun" viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.29 1.29c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.29 1.29c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-1.29-1.29zm1.41-13.78c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l1.29 1.29c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-1.29-1.29zM7.28 18.36c.39-.39.39-1.02 0-1.41a.996.996 0 00-1.41 0l-1.29 1.29c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.29-1.29z"></path></svg>
        <svg class="icon-moon" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"></path></svg>
    </button>
    <div class="container">
        <img src="${imageBase64}" alt="Cloudflare">
        <h1>CloudCode CLI 中转正在运行中！</h1>
        <p>该 CloudCode CLI 中转由 Cloudflare 驱动</p>
        <div class="api-info">
            <div><strong>支持的 API 路径：</strong></div>
            <div><code>/v1internal:streamGenerateContent</code></div>
            <div><code>/v1internal:generateContent</code></div>
            <div><code>/v1internal:fetchAvailableModels</code></div>
            <div><code>/v1internal:countTokens</code></div>
        </div>
        <div class="footer">
            作者GitHub: <a href="https://github.com/ikun-11451/siliconflow-balance-lite" target="_blank">GitHub</a>
        </div>
    </div>
    <script>
        (function() {
            const toggleBtn = document.getElementById('theme-toggle');
            const root = document.documentElement;
            
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                root.setAttribute('data-theme', savedTheme);
            }

            toggleBtn.addEventListener('click', () => {
                const currentTheme = root.getAttribute('data-theme');
                let targetTheme = 'light';
                
                if (currentTheme === 'light') {
                    targetTheme = 'dark';
                } else if (currentTheme === 'dark') {
                    targetTheme = 'light';
                } else {
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        targetTheme = 'light';
                    } else {
                        targetTheme = 'dark';
                    }
                }
                
                root.setAttribute('data-theme', targetTheme);
                localStorage.setItem('theme', targetTheme);
            });
        })();
    </script>
</body>
</html>
    `;
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  if (pathname === '/verify' && request.method === 'POST') {
    return handleVerification(request);
  }

  // 处理 CloudCode CLI API 请求
  if (pathname.startsWith('/v1internal')) {
    return cloudcode.fetch(request);
  }

  // 处理 OpenAI 格式请求 (保留向后兼容)
  if (pathname.endsWith("/chat/completions") || pathname.endsWith("/completions") || pathname.endsWith("/embeddings") || pathname.endsWith("/models")) {
    return openai.fetch(request);
  }

  // 默认转发到 SiliconFlow (保留向后兼容)
  const targetUrl = `https://api.siliconflow.cn/v1${pathname}${search}`;

  try {
    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
      if (key.trim().toLowerCase() === 'authorization') {
        const authValue = value.replace(/^Bearer\s+/i, '');
        const apiKeys = authValue.split(',').map(k => k.trim()).filter(k => k);
        if (apiKeys.length > 0) {
          const selectedKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
          console.log(`SiliconFlow Selected API Key: ${selectedKey}`);
          headers.set('Authorization', `Bearer ${selectedKey}`);
        }
      } else {
        if (key.trim().toLowerCase()==='content-type')
        {
           headers.set(key, value);
        }
      }
    }

    console.log('Request Sending to SiliconFlow')
    console.log('targetUrl:'+targetUrl)
    console.log(headers)

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.body
    });

    console.log("Call SiliconFlow Success")

    const responseHeaders = new Headers(response.headers);

    console.log('Header from SiliconFlow:')
    console.log(responseHeaders)

    responseHeaders.delete('transfer-encoding');
    responseHeaders.delete('connection');
    responseHeaders.delete('keep-alive');
    responseHeaders.delete('content-encoding');
    responseHeaders.set('Referrer-Policy', 'no-referrer');

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });

  } catch (error) {
   console.error('Failed to fetch:', error);
   return new Response('Internal Server Error\n' + error?.stack, {
    status: 500,
    headers: { 'Content-Type': 'text/plain' }
   });
}
};
