import { t, type Static } from "elysia";

export const TranslateRequestSchema = t.Object({
    text: t.String(),
    targetLanguage: t.Union([t.Literal("TH"), t.Literal("EN")]),
});

//maxsituation เดี๋ยว get จาก user ว่าเป็นระดับ normal/premium หรือ ... หลังบ้าน get
//situationTypes: จะกำหนดได้ตาม maxsituation ถ้าเกิด ตัดอันที่เกินออก
export const SituationRequestSchema = t.Object({
    text: t.String(),
    sourceLanguage: t.Union([t.Literal("TH"), t.Literal("EN")]),
    targetLanguage: t.Union([t.Literal("TH"), t.Literal("EN")]),
    situationTypes: t.Optional(t.Array(t.Object({
        type: t.Union([t.Literal("Declarative"), t.Literal("Interrogative"), t.Literal("Imperative"), t.Literal("Exclamatory")]),
        description: t.Optional(t.String()),
    })))
});

export type TranslateRequest = Static<typeof TranslateRequestSchema>;
export type SituationRequest = Static<typeof SituationRequestSchema>;