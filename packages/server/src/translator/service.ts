import OpenAI from "openai";
import type { TranslateRequest } from "./model/req";
import type { SituationRequest } from "./model/req";
import type { SituationResponseSchemaType, TranslateResponseSchemaType } from "./model/res";
import { MAPPING_INSTRUCTION } from "./constant/instruction";

class TranslatorService {
    private readonly openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    public async translate({ text, targetLanguage }: TranslateRequest): Promise<TranslateResponseSchemaType> {
        try {
            const { instruction, model, schema, temperature } = MAPPING_INSTRUCTION.Translator;
            const aiResult = await this.openai.responses.parse({
                temperature: temperature,
                model: model,
                instructions: instruction,
                input: [
                    {
                        role: "user",
                        content: `Translate the following text to ${targetLanguage}: ${text}`
                    }
                ],
                text: {
                    format: schema,
                }
            })

            return {
                data: {
                    translatedText: aiResult.output_parsed?.translatedText!,
                },
            }
        } catch (error) {
            return {
                success: false,
                message: "Failed to translate text",
                error: error as string,
            }
        }
    }

    public async situation({ text, targetLanguage, sourceLanguage, situationTypes }: SituationRequest): Promise<SituationResponseSchemaType> {
        try {
            const { instruction, model, schema, temperature } = MAPPING_INSTRUCTION.Situation;

            let situationTypesInstruction = "";
            if (situationTypes) {
                situationTypesInstruction = situationTypes?.map((item) => `- ${item.type}: ${item.description || "Think by AI Teacher"}`).join("\n");
            }

            //trim situation type following user level

            const aiResult = await this.openai.responses.parse({
                temperature: temperature,
                model: model,
                instructions: instruction,
                input: [
                    {
                        role: "user",
                        content: `
                            Generate a situation based on the following text: ${text}. and translate it to ${targetLanguage} language. and the situation should be in ${sourceLanguage} language,
                            The order of situation types follow this:
                            ${situationTypesInstruction || "All Declarative"}
                            `
                    }
                ],
                text: {
                    format: schema,
                }
            })

            return {
                data: aiResult.output_parsed!.data.map((item) => ({
                    situation: item.situation,
                    translatedSituation: item.translatedSituation,
                })),
            }
        } catch (error) {
            return {
                success: false,
                message: "Failed to generate situation",
                error: error as string,
            }
        }
    }
}

export default new TranslatorService();