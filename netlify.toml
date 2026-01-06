// netlify/functions/mad-gemini.js

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  };

  try {
    // Preflight
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers, body: "" };
    }

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ replyHtml: "Method Not Allowed" }),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          replyHtml: "❌ GEMINI_API_KEY غير موجود في Netlify Environment Variables (Production).",
        }),
      };
    }

    const req = JSON.parse(event.body || "{}");
    const message = (req.message || "").trim();
    const pageUrl = req.pageUrl || "";
    const pageTitle = req.pageTitle || "";
    const lang = req.lang || "ar";

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ replyHtml: "اكتب سؤالاً." }),
      };
    }

    const model = "gemini-1.5-flash";
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const system = `
أنت مساعد MAD Perfume (عربي/عبري).
- إذا المستخدم كتب كود منتج (مثل W183) أعطه رابط الشراء إن وُجد.
- إذا سأل عن فرع/مدينة أعطه رقم الهاتف وساعات الدوام ورابط Waze إن توفر.
- إذا المعلومات غير متوفرة قل ذلك بوضوح ولا تخترع.
- ردك يكون HTML بسيط (بدون Markdown).
`;

    const prompt = `
SYSTEM:
${system}

CONTEXT:
title: ${pageTitle}
url: ${pageUrl}
lang: ${lang}

USER:
${message}
`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
      }),
    });

    const data = await geminiRes.json().catch(() => ({}));

    // ✅ إذا Gemini رجّع خطأ: أظهره للعميل
    if (!geminiRes.ok) {
      const errMsg =
        data?.error?.message ||
        data?.message ||
        JSON.stringify(data).slice(0, 500);

      return {
        statusCode: geminiRes.status,
        headers,
        body: JSON.stringify({
          replyHtml:
            "❌ Gemini Error: " + errMsg.replace(/</g, "&lt;").replace(/>/g, "&gt;"),
        }),
      };
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("")?.trim();

    if (!text) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          replyHtml:
            "❌ لم يصل نص من Gemini. (قد تكون مشكلة صلاحيات/Quota).",
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ replyHtml: text }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        replyHtml: "❌ Server error: " + (e?.message || String(e)),
      }),
    };
  }
};
