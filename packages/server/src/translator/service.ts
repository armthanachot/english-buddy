import OpenAI from "openai";
import type { TranslateRequest, SituationRequest, UsageExplanationRequest, KeywordDetectRequest } from "shared/model/translator/req";
import type { KeywordDetectResponseSchemaType, SituationResponseSchemaType, TKeywordDetect, TSituation, TranslateResponseSchemaType, TTranslate, UsageExplanationResponseSchemaType, TUsageExplanation, ConversationResponseSchemaType, TConversation } from "shared/model/translator/res";
import { CONVERSATION_MAPPING_INSTRUCTION, MAPPING_INSTRUCTION } from "./constant/instruction";
import type { AIParseSchemaType, ConversationRequestSchemaType, FileUploadRequestSchemaType } from "./model/req";
import type { drizzle } from "drizzle-orm/node-postgres";
import db from "../../dependencies/db";
import type { GetUserByIdResponse } from "shared/model/user/res";
import { userTable } from "../../schema/user";
import { and, eq } from "drizzle-orm";
import { userConversationTable } from "../../schema/user_conversation";
import type { ResponseInput } from "openai/resources/responses/responses.mjs";
class TranslatorService {
    private readonly openai: OpenAI;
    private readonly _db: ReturnType<typeof drizzle>

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        this._db = db.db;
    }

    private async _getUserById(userId: string): Promise<GetUserByIdResponse> {
        const users = await this._db.select().from(userTable).where(eq(userTable.id, userId))
        if (!users.length) {
            throw new Error("User not found");
        }

        const [user] = users;

        if (!user) {
            throw new Error("User not found");
        }

        return {
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
            }
        }
    }

    private async _getUserConversationId(userId: string, type: keyof typeof MAPPING_INSTRUCTION): Promise<string> {
        const conv = await this._db.select().from(userConversationTable).where(and(eq(userConversationTable.userId, userId), eq(userConversationTable.type, type), eq(userConversationTable.isActive, true)))
        if (!conv.length) {
            throw new Error("Conversation not found");
        }

        const [conversation] = conv;

        if (!conversation) {
            throw new Error("Conversation not found");
        }

        return conversation.conversationId;
    }

    private async _aiParse<T extends TTranslate | TSituation | TUsageExplanation | TKeywordDetect>(param: AIParseSchemaType, input: string | ResponseInput | undefined): Promise<T> {
        await this._getUserById(param.userId); //check if user exists
        
        const { instruction, model, schema, temperature } = MAPPING_INSTRUCTION[param.type as keyof typeof MAPPING_INSTRUCTION];

        const conversationId = await this._getUserConversationId(param.userId, param.type); //check if user has conversation


        const aiResult = await this.openai.responses.parse({
            temperature: temperature,
            model: model,
            conversation: conversationId,
            instructions: instruction,
            input: input,
            text: {
                format: schema,
            }
        })

        if (aiResult.output_parsed == null) {
            throw new Error("AI parsing failed: output_parsed is null");
        }

        return (aiResult.output_parsed as T & { data: T }).data ?? aiResult.output_parsed as T;
    }

    public async translate({ text, targetLanguage, userId }: TranslateRequest): Promise<TranslateResponseSchemaType> {
        try {
            const resp = await this._aiParse<TTranslate>({
                userId: userId,
                type: "Translator",
            }, [
                {
                    role: "user",
                    content: `Translate the following text to ${targetLanguage}: ${text}`
                }
            ]);

            return {
                data: resp,
            };
        } catch (error) {
            return {
                success: false,
                message: "Failed to translate text",
                error: error as string,
            }
        }
    }

    public async situation({ text, targetLanguage, sourceLanguage, situationTypes, difficultyLevel, userId }: SituationRequest): Promise<SituationResponseSchemaType> {
        try {
            let situationTypesInstruction = "";
            if (situationTypes) {
                situationTypesInstruction = situationTypes?.map((item) => `- ${item.type}: ${item.description || "Think by AI Teacher"} and the style should be ${item.style}`).join("\n");
            }

            const resp = await this._aiParse<TSituation>({
                userId: userId,
                type: "Situation",
            }, [
                {
                    role: "user",
                    content: `Generate a situation based on the following text: ${text}. and translate it to ${targetLanguage} language. and the situation should be in ${sourceLanguage} language,
                    The order of situation types follow this:
                    ${situationTypesInstruction || "All Declarative"}
                    and the difficulty level of the input text is ${difficultyLevel}.
                    `
                }
            ]);

            return {
                data: resp,
            };
        } catch (error) {
            return {
                success: false,
                message: "Failed to generate situation",
                error: error as string,
            }
        }
    }

    public async usageExplanation({ text, phrase, explanationLanguage, userId }: UsageExplanationRequest): Promise<UsageExplanationResponseSchemaType> {
        try {
            const resp = await this._aiParse<TUsageExplanation>({
                userId: userId,
                type: "UsageExplanation",
            }, [
                {
                    role: "user",
                    content: `Explain how the following text ${text} is used in a specific phrase: ${phrase}. and the explanation language should be ${explanationLanguage} language.`
                }
            ]);
            return {
                data: resp,
            };
        } catch (error) {
            return {
                success: false,
                message: "Failed to generate usage explanation",
                error: error as string,
            }
        }
    }

    public async keywordDetect({ text, language, userId }: KeywordDetectRequest): Promise<KeywordDetectResponseSchemaType> {
        try {
            const resp = await this._aiParse<TKeywordDetect>({
                userId: userId,
                type: "KeywordDetect",
            }, [
                {
                    role: "user",
                    content: `Detect the keywords in the following text: ${text}. and the language should be ${language} language.`
                }
            ]);
            return {
                data: resp,
            };
        } catch (error) {
            return {
                success: false,
                message: "Failed to detect keywords",
                error: error as string,
            }
        }
    }

    public async fileTranslation({ file, targetLanguage, userId }: FileUploadRequestSchemaType): Promise<TranslateResponseSchemaType> {
        const f = await this.openai.files.create({
            file: file,
            purpose: 'user_data',
        })

        const resp = await this._aiParse<TTranslate>({
            userId: userId,
            type: "Translator",
        }, [{
            role: "user",
            content: [{
                type: "input_file",
                file_id: f.id,
            },
            {
                type: "input_text",
                text: `Translate the following file to ${targetLanguage}`,
            },]
        }

        ]);

        return {
            data: resp,
        };
    }

    public async conversation({ conversationId, prompt }: ConversationRequestSchemaType): Promise<ConversationResponseSchemaType> {

        const { instruction, model, schema, temperature } = CONVERSATION_MAPPING_INSTRUCTION.Conversation;

        const result = await this.openai.responses.parse({
            temperature: temperature,
            model: model,
            conversation: conversationId,
            instructions: instruction,
            input: prompt,
            text: {
                format: schema,
            },
        })

        if (result.output_parsed == null) {
            throw new Error("AI parsing failed: output_parsed is null");
        }

        return {
            data: result.output_parsed as TConversation,
        };
    }
}

export default new TranslatorService();