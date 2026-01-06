exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  };

  // CORS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "GEMINI_API_KEY غير موجود في Netlify (Production)",
        }),
      };
    }

    const req = JSON.parse(event.body || "{}");
    const message = (req.message || "").trim();

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "الرسالة فارغة" }),
      };
    }

    const model = "gemini-1.5-flash";
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: message }],
          },
        ],
      }),
    });

    const data = await geminiRes.json().catch(() => ({}));

    if (!geminiRes.ok) {
      return {
        statusCode: geminiRes.status,
        headers,
        body: JSON.stringify({
          geminiError: data.error || data,
        }),
      };
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply: text || "لا يوجد رد من Gemini",
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        serverError: err.message || String(err),
      }),
    };
  }
};
