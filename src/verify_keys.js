async function verifyKey(key, controller) {
  const url = 'https://api.siliconflow.cn/v1/chat/completions';
  const body = {
    "model": "Qwen/Qwen2.5-7B-Instruct",
    "messages": [{
      "role": "user",
      "content": "Hello"
    }],
    "max_tokens": 10
  };
  let result;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });
    if (response.ok) {
      await response.text(); // Consume body to release connection
      result = { key: `${key.slice(0, 7)}......${key.slice(-7)}`, status: 'GOOD' };
    } else {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      result = { key: `${key.slice(0, 7)}......${key.slice(-7)}`, status: 'BAD', error: errorData.error?.message || errorData.message || 'Unknown error' };
    }
  } catch (e) {
    result = { key: `${key.slice(0, 7)}......${key.slice(-7)}`, status: 'ERROR', error: e.message };
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
    const keys = authValue.split(',').map(k => k.trim()).filter(Boolean);

    const stream = new ReadableStream({
      async start(controller) {
        const verificationPromises = keys.map(key => verifyKey(key, controller));
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
    return new Response(JSON.stringify({ error: 'An unexpected error occurred: ' + e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
