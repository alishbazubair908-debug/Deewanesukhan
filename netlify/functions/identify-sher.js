// Netlify serverless function — runs on Netlify's server, never in the browser.
// The real Gemini API key lives only here, read from an environment variable
// (set it in: Site configuration → Environment variables → GEMINI_API_KEY).
// It is never sent to, or visible in, the client's page source.

const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let sher = '';
  try {
    const body = JSON.parse(event.body || '{}');
    sher = (body.sher || '').trim();
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }
  if (!sher) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No sher provided' }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server is missing GEMINI_API_KEY environment variable' })
    };
  }

  const prompt = `You are an expert on Urdu poetry (Ghazal, Nazm, and classical/modern Ash'aar).
Given the following sher (couplet), identify the most likely poet.
Respond with ONLY a raw JSON object (no markdown, no code fences) in exactly this shape:
{"poet": "poet's name", "confidence_score": "High|Medium|Low", "era": "e.g. Classical Era, Modern Era, Contemporary, or Unknown", "ghazal_context": "brief context about the ghazal/nazm this couplet is from, or the couplet itself if unknown", "explanation": "1-3 sentences explaining the reasoning or the couplet's meaning"}

Sher:
${sher}`;

  // Netlify's free-tier synchronous function limit is 10 seconds, so we can't
  // afford generous retries/backoff here — one fast attempt per model, no
  // artificial delay, falling through to the next model immediately on failure.
  const maxAttemptsPerModel = 1;
  let res, lastErr;

  outer:
  for (let m = 0; m < GEMINI_MODELS.length; m++) {
    const model = GEMINI_MODELS[m];
    for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
              },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
              signal: controller.signal
            }
          );
        } finally {
          clearTimeout(timeout);
        }

        if (res.ok) break outer;

        if (res.status === 503 || res.status === 429) {
          if (attempt < maxAttemptsPerModel) {
            await new Promise(r => setTimeout(r, attempt * 1200));
            continue;
          }
          if (m < GEMINI_MODELS.length - 1) break;
        }

        let bodyText = '';
        try { bodyText = await res.text(); } catch (_) {}
        console.error(`Gemini API error for model "${model}": status ${res.status}`, bodyText);
        lastErr = new Error(`Gemini API error: ${res.status} — ${bodyText.slice(0, 300)}`);

        if (res.status === 404 && m < GEMINI_MODELS.length - 1) break;
      } catch (fetchErr) {
        lastErr = fetchErr;
        if (attempt < maxAttemptsPerModel) {
          await new Promise(r => setTimeout(r, attempt * 1200));
          continue;
        }
        if (m < GEMINI_MODELS.length - 1) break;
      }
    }
  }

  if (!res || !res.ok) {
    const status = (res && (res.status === 503 || res.status === 429)) ? res.status : 502;
    return {
      statusCode: status,
      body: JSON.stringify({ error: (lastErr && lastErr.message) || 'All models failed' })
    };
  }

  try {
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleaned);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to parse model response' }) };
  }
};
