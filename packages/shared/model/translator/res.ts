import { Type as t, type Static } from "@sinclair/typebox";
import { ResSchema } from "../response";

export const TTranslate = t.Object({
    translatedText: t.String(),
})
export const TranslateResponseSchema = ResSchema(TTranslate)

export const TSituation = t.Array(t.Object({
    situation: t.String(),
    translatedSituation: t.String(),
}))
export const SituationResponseSchema = ResSchema(TSituation)

export const TUsageExplanation = t.Object({
    usageExplanation: t.String(),
})
export const UsageExplanationResponseSchema = ResSchema(TUsageExplanation)

export const TKeywordDetect = t.Array(t.Object({
    phrase: t.String(),
    explanation: t.String(),
}))
export const KeywordDetectResponseSchema = ResSchema(TKeywordDetect)

export const TConversation = t.Object({
    answer: t.String(),
})
export const ConversationResponseSchema = ResSchema(TConversation)

export type TTranslate = Static<typeof TTranslate>;
export type TSituation = Static<typeof TSituation>;
export type TUsageExplanation = Static<typeof TUsageExplanation>;
export type TKeywordDetect = Static<typeof TKeywordDetect>;
export type TConversation = Static<typeof TConversation>;
export type TranslateResponseSchemaType = Static<typeof TranslateResponseSchema>;
export type SituationResponseSchemaType = Static<typeof SituationResponseSchema>;
export type UsageExplanationResponseSchemaType = Static<typeof UsageExplanationResponseSchema>;
export type KeywordDetectResponseSchemaType = Static<typeof KeywordDetectResponseSchema>;
export type ConversationResponseSchemaType = Static<typeof ConversationResponseSchema>;