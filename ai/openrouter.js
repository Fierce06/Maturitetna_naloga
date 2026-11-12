
require("dotenv").config();

const OPENROUTER_URL = "https://openrouter.ai/api/v1";

const MODEL =
    process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

async function generateQuiz({ topic, difficulty = "medium", questionCount = 10 }) {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();

    if (!apiKey) {
        throw new Error("Missing OPENROUTER_API_KEY in .env");
    }

    const response = await fetch(
        `${OPENROUTER_URL}/chat/completions`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: MODEL,
                response_format: {
                    type: "json_object",
                },
                messages: [
                    {
                        role: "system",
                        content: `
You are an educational quiz generator.

Generate quizzes based on the provided topic.

Return ONLY valid JSON using this structure:
{
    "title": "Quiz title",
    "questions": [
        {
            "question": "Question text",
            "options": [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            "correctAnswer": 0,
            "explanation": "Explanation of the correct answer"
        }
    ]
}

The correctAnswer must be the zero-based index
of the correct option.

Generate exactly the requested number of questions.
                        `.trim(),
                    },
                    {
                        role: "user",
                        content: `
Topic: ${topic}
Difficulty: ${difficulty}
Number of questions: ${questionCount}
                        `.trim(),
                    },
                ],
            }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    console.dir(data.choices[0].message, { depth: null });
    if (!content) {
        throw new Error("OpenRouter returned an empty response. Finish reason: " + data?.choices?.[0]?.finish_reason);
    }

    try {
        return JSON.parse(content);
    } catch {
        throw new Error("OpenRouter returned invalid JSON.");
    }
}

module.exports = {
    generateQuiz,
};
