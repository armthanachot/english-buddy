import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});




const result = await openai.conversations.delete("conv_69391aafa58c8193a16fefd3348c65100110e7ea12adc940")

console.log(result);
