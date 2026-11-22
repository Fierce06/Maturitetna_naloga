
require("dotenv").config();
const dbUsers = require("../model/dbUsers");

const OPENROUTER_URL = "https://openrouter.ai/api/v1";

const MODEL =
    process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

async function generateQuiz({ topic, difficulty = "medium", questionCount = 10, userId }) {
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

    const usage = data.usage;

    console.log("========== QUIZ TOKEN USAGE ==========");
    console.log("Model:", data.model);
    console.log("Prompt tokens:", usage?.prompt_tokens);
    console.log("Completion tokens:", usage?.completion_tokens);
    console.log("Total tokens:", usage?.total_tokens);
    console.log("Cost (USD):", usage?.cost);
    console.log("======================================");

    await dbUsers.updateTokenUse(usage?.total_tokens || 0, userId);

    if (!content) {
        throw new Error("OpenRouter returned an empty response. Finish reason: " + data?.choices?.[0]?.finish_reason);
    }

    try {
        return JSON.parse(content);
    } catch {
        throw new Error("OpenRouter returned invalid JSON.");
    }
}

async function generateNoteConnections({ noteContent, userId, noteDescriptions = [] }) {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    const existingNotes = (Array.isArray(noteDescriptions) ? noteDescriptions : [])
        .filter(note => Number.isInteger(Number(note.id)) && Number(note.id) > 0);
    const existingNotesJson = JSON.stringify(existingNotes);

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
You are an educational note connection generator.

Given the content of a note and a list of existing note IDs, identify the IDs that are most relevant to the note.

Return only valid JSON using this exact structure:
{
  "ids": "3,5,6",
  "short_description": "A brief description of the connection"
}

Rules:
- "ids" must be a comma-separated string of existing note IDs.
- Do not use spaces after commas.
- Do not add note titles or other text.
- Do not invent IDs that are not in the provided existing note ID list.
- Return an empty string if no note is relevant.
- Prefer the most relevant notes and return at most 10 IDs.
- Short_description should be a concise summary of the current note's content.
                        `.trim(),
                    },
                    {
                        role: "user",
                        content: `
Existing notes JSON:
${existingNotesJson}
Note content:
${noteContent}
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

    const usage = data.usage;

    await dbUsers.updateTokenUse(usage?.total_tokens || 0, userId);

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
    generateNoteConnections,
};
