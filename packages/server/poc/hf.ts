import { OpenAI } from "openai";
import dotenv from "dotenv";
import path from "path";
import fs from 'fs'
dotenv.config({
    path: path.resolve(__dirname, "../.env"),
});

const client = new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: process.env.HF_TOKEN,
});

const chatCompletion = await client.responses.create({
    model: "Qwen/Qwen3-4B-Instruct-2507:nscale",
    temperature: 0.7,
    stream: true,
    instructions: `
        You are a linguistics-focused writing assistant and a professional Markdown formatter.
        Your task is to produce ONLY the final content, do not include any other text.

        Your task is to transform the given content into a well-structured, publication-quality Markdown document.

        Requirements:
        - Preserve the original meaning and technical accuracy.
        - Organize the content into clear sections with logical headings.
        - Use Markdown features deliberately: headings, tables, blockquotes, bold/italic emphasis, and bullet points where appropriate.
        - Add subtle, relevant emojis ONLY to enhance readability (not decoration).
        - Explicitly explain structure, grammar roles, and nuance when the content involves language analysis.
        - Highlight key insights, contrasts, and conclusions.
        - End with a concise but insightful summary section.

        Tone:
        - Analytical, precise, and confident.
        - Neutral and explanatory, not conversational or promotional.

        Do NOT:
        - Add new facts that are not implied by the input.
        - Overuse emojis or formatting.
        - Repeat the prompt or explain what you are doing.

        Output:
        - Markdown only.
    `,
    input: "คำว่า **“optimistic”** ในประโยคนี้ทำหน้าที่เป็น **คำคุณศัพท์ (adjective)** ใช้เป็น **ส่วนเติมเต็มของประธาน (subject complement)** ตามหลังกริยา **be** ในรูปย่อ **“he’s” (he is)** ในวลี **“he’s still optimistic about his Nasdaq picks”** โดยโครงสร้างหลักคือ **he (ประธาน) + is (กริยา be) + optimistic (ส่วนเติมเต็ม/คำบอกสภาพของประธาน)** และมีส่วนขยายคือ **about his Nasdaq picks** ที่บอกขอบเขตของทัศนคติว่าเกี่ยวกับ “หุ้น Nasdaq ที่เขาเลือก” ด้านความหมาย **“optimistic”** ในที่นี้หมายถึง “มองโลกในแง่ดี / มีความหวัง / เชื่อว่าผลลัพธ์จะเป็นบวกในอนาคต” ซึ่งเชื่อมโยงโดยตรงกับวลี **about his Nasdaq picks** คือเขามีทัศนคติในเชิงบวกต่อการลงทุนชุดนั้น ด้านนิวอองซ์ เกิดจากการใช้คำว่า **“still”** วางหน้าคำคุณศัพท์ **“optimistic”** ทำให้เกิดน้ำเสียงของ “ความคงทนของทัศนคติ” คือ แม้จะมีเหตุการณ์ด้านลบมาก่อนหน้า (ตามส่วนต้นของประโยค **Even after the Fed’s last announcement spooked the market**) เขา **ก็ยัง** ไม่เปลี่ยนจากการมองโลกในแง่ดี คำอธิบายตามหลังด้วย **“saying the volatility is just noise before the next big rally”** ยืนยันนิวอองซ์นี้ทางความหมาย โดยชี้ให้เห็นว่า ความผันผวน (volatility) ถูกลดทอนความสำคัญให้เป็นเพียง “noise” เมื่อเทียบกับ “the next big rally” ที่เขาคาดหวัง ทำให้คำว่า **“optimistic”** ในบริบทนี้สื่อถึงทัศนคติแบบเชื่อมั่นในอนาคตเชิงบวก แม้เผชิญข้อมูลปัจจุบันที่ไม่น่าพอใจ แทนที่จะเป็นเพียงอารมณ์ดีชั่วคราว",
});


for await (const chunk of chatCompletion) {
    if(chunk.type === "response.output_text.delta"){
        fs.appendFileSync(path.resolve(__dirname, "./output.md"), chunk.delta || "");
    }
}

console.log("done");