// CloudCode CLI API Key 验证
// 由于 CloudCode 使用 OAuth2 Token，验证方式与 SiliconFlow 不同

async function verifyCloudCodeToken(token, controller) {
  // CloudCode 使用 OAuth2 Token，我们尝试调用一个轻量级 API 来验证
  const url = 'https://cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels';
  
  let result;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'antigravity/1.19.6 darwin/arm64',
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      await response.text(); // Consume body to release connection
      result = { key: `${token.slice(0, 7)}......${token.slice(-7)}`, status: 'GOOD' };
    } else {
      const errorText = await response.text().catch(() => 'Unknown error');
      result = { key: `${token.slice(0, 7)}......${token.slice(-7)}`, status: 'BAD', error: errorText };
    }
  } catch (e) {
    result = { key: `${token.slice(0, 7)}......${token.slice(-7)}`, status: 'ERROR', error: e.message };
  }
  
  controller.enqueue(new TextEncoder().encode('data: ' + JSON.stringify(result) + '\n\n'));
}

export async function handleVerification(request) {
  try {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const authValue = authHeader.replace(/^Bearer\s+/i, '');
    const tokens = authValue.split(',').map(k => k.trim()).filter(Boolean);

    const stream = new ReadableStream({
      async start(controller) {
        const verificationPromises = tokens.map(token => verifyCloudCodeToken(token, controller));
        await Promise.all(verificationPromises);
        controller.close();
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: 'An unexpected error occurred: ' + e.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
