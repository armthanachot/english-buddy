import { Type as t, type Static } from "@sinclair/typebox";

export const TranslateRequestSchema = t.Object({
    text: t.String(),
    targetLanguage: t.Union([t.Literal("TH"), t.Literal("EN")]),
});


//maxsituation เดี๋ยว get จาก user ว่าเป็นระดับ normal/premium หรือ ... หลังบ้าน get
//situationTypes: จะกำหนดได้ตาม maxsituation ถ้าเกิด ตัดอันที่เกินออก
export const SituationRequestSchema = t.Object({
    text: t.String(),
    difficultyLevel: t.Union([t.Literal("Beginner"), t.Literal("Intermediate"), t.Literal("Advanced")]),
    sourceLanguage: t.Union([t.Literal("TH"), t.Literal("EN"), t.Literal("JA"), t.Literal("ZH"), t.Literal("VI"), t.Literal("ID")]),
    targetLanguage: t.Union([t.Literal("TH"), t.Literal("EN"), t.Literal("JA"), t.Literal("ZH"), t.Literal("VI"), t.Literal("ID")]),
    situationTypes: t.Optional(t.Array(t.Object({
        type: t.Union([t.Literal("Declarative"), t.Literal("Interrogative"), t.Literal("Imperative"), t.Literal("Exclamatory")]),
        description: t.Optional(t.String()),
        style: t.Optional(t.Union([
            t.Literal("Native"),
            t.Literal("Casual"),
            t.Literal("Neutral"),
            t.Literal("Formal"),
            t.Literal("Slang"),
            t.Literal("Academic"),
            t.Literal("Grammatical")
        ],{
            default:"Grammatical"
        })),
    })))
});

export const UsageExplanationRequestSchema = t.Object({
    text: t.String(),
    phrase: t.String(),
    explanationLanguage: t.Union([t.Literal("TH"), t.Literal("EN"), t.Literal("JA"), t.Literal("ZH"), t.Literal("VI"), t.Literal("ID")]),
});


export const KeywordDetectRequestSchema = t.Object({
    text: t.String(),
    language: t.Union([t.Literal("TH"), t.Literal("EN"), t.Literal("JA"), t.Literal("ZH"), t.Literal("VI"), t.Literal("ID")]),
});

export type TranslateRequest = Static<typeof TranslateRequestSchema>;
export type SituationRequest = Static<typeof SituationRequestSchema>;
export type UsageExplanationRequest = Static<typeof UsageExplanationRequestSchema>;
export type KeywordDetectRequest = Static<typeof KeywordDetectRequestSchema>;