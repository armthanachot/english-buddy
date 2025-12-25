import { OpenAI } from "openai";
import dotenv from "dotenv";
import path from "path";
import fs from 'fs'

dotenv.config({
    path: path.resolve(__dirname, "../.env"),
});


const genMd = async (text: string, instructions: string) => {
    const client = new OpenAI({
        baseURL: process.env.HF_BASE_URL,
        apiKey: process.env.HF_TOKEN,
    });

    const chatCompletion = await client.responses.create({
        model: process.env.QWEN3_MODEL,
        temperature: 0.7,
        stream: true,
        instructions: instructions,
        input: text
    });

    const fileName = `${Date.now()}.md`;

    for await (const chunk of chatCompletion) {
        if (chunk.type === "response.output_text.delta") {
            fs.appendFileSync(path.resolve(__dirname, `../public/md/${fileName}`), chunk.delta || "");
        }
    }

    return fileName;
}

export {
    genMd
}