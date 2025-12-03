const { GoogleGenAI } = require('@google/genai');

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!API_KEY) {
    console.warn("[Gemini] GEMINI_API_KEY is not set. /chat endpoint will return 500.");
}

// Khởi tạo GoogleGenAI client
let ai = null;
if (API_KEY) {
    try {
        ai = new GoogleGenAI({ apiKey: API_KEY });
    } catch (err) {
        console.error("[Gemini] Failed to initialize GoogleGenAI:", err.message);
    }
}

async function callGemini({ systemPrompt, userMessage, history = [] }) {
    if (!API_KEY) {
        throw new Error("GEMINI_API_KEY is missing");
    }
    if (!ai) {
        throw new Error("GoogleGenAI client is not initialized");
    }

    try {
        // Chuyển đổi history sang format của SDK
        const contents = [];

        // History: [{ role: 'user'|'assistant', content: string }]
        history.forEach((msg) => {
            if (!msg || !msg.role || !msg.content) return;
            const role = msg.role === "assistant" ? "model" : "user";
            contents.push({
                role,
                parts: [{ text: msg.content }],
            });
        });

        // Thêm message hiện tại
        contents.push({
            role: "user",
            parts: [{ text: userMessage }],
        });

        // Cấu hình request
        const requestConfig = {
            model: MODEL,
            contents: contents,
        };

        // Thêm systemInstruction nếu có
        if (systemPrompt) {
            requestConfig.config = {
                systemInstruction: systemPrompt,
            };
        }

        // Gọi API
        const response = await ai.models.generateContent(requestConfig);

        // Lấy text từ response
        const text = response.text ||
            "Xin lỗi, hiện tại em đang gặp chút trục trặc, anh/chị có thể thử lại giúp em nhé.";

        return text;
    } catch (err) {
        console.error("[Gemini] API error:", err.message);
        console.error("[Gemini] Error name:", err.name);
        console.error("[Gemini] Error status:", err.status);
        console.error("[Gemini] Error stack:", err.stack);
        throw new Error(`Gemini API error: ${err.message}`);
    }
}

module.exports = {
    callGemini,
};