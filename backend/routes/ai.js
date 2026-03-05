import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey.length < 10) {
            return res.status(401).json({
                success: false,
                reply: "AI key is missing! Please check the .env file."
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Preferred models based on your key's access
        const modelsToTry = [
            "gemini-2.0-flash",
            "gemini-2.5-flash",
            "gemini-1.5-flash"
        ];

        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(message);
                const response = await result.response;
                const text = response.text();

                if (text) {
                    return res.json({
                        success: true,
                        reply: text
                    });
                }
            } catch (err) {
                lastError = err;
                console.error(`🤖 AI Error (${modelName}):`, err.message);

                // If rate limited, we can't do much but wait
                if (err.status === 429 || err.message.includes('429')) {
                    return res.status(429).json({
                        success: false,
                        reply: "I'm thinking too hard! (Rate Limit). Please wait 10-15 seconds and ask again. 🧠⚡"
                    });
                }

                // If model not found, try next
                if (err.status === 404 || err.message.includes('404')) continue;
            }
        }

        res.status(500).json({
            success: false,
            reply: "I'm having a hard time connecting. Google AI might be busy, please try again in a moment.",
            error: lastError?.message
        });

    } catch (error) {
        console.error('Critical Chat Error:', error);
        res.status(500).json({
            success: false,
            reply: "Something went wrong in my cognitive core. Please refresh and try again.",
            error: error.message
        });
    }
});

export default router;
