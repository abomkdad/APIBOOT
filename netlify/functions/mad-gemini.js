export default async (request) => {
  try {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = await request.json();
    const { message, pageUrl, pageTitle, lang } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ replyHtml: "GEMINI_API_KEY غير موجود في Netlify" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const model = "gemini-1.5-flash";
    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const systemPrompt = `
أنت مساعد MAD Perfume.
- رد HTML بسيط.
- لا تخترع منتجات أو فروع.
- عربي ↔ عبري تلقائي.
- إذا سأل عن توفر: اقترح الاتصال بالفرع.
`;

    const geminiRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: systemPrompt },
            { text: `PAGE:${pageTitle}\nURL:${pageUrl}\nLANG:${lang}\nUSER:${message}` }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 700
        }
      })
    });

    const data = await geminiRes.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ||
      "لم أتمكن من الرد الآن.";

    return new Response(
      JSON.stringify({ replyHtml: text.replace(/```/g, "").trim() }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ replyHtml: "Server error: " + err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
