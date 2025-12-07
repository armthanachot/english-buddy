import { Type as t, type Static } from "@sinclair/typebox";
import { ResSchema } from "../response";

export const TranslateResponseSchema = ResSchema(t.Object({
    translatedText: t.String(),
}))

export const SituationResponseSchema = ResSchema(t.Array(t.Object({
    situation: t.String(),
    translatedSituation: t.String(),
})))

export const UsageExplanationResponseSchema = ResSchema(t.Object({
    usageExplanation: t.String(),
}))

export type TranslateResponseSchemaType = Static<typeof TranslateResponseSchema>;
export type SituationResponseSchemaType = Static<typeof SituationResponseSchema>;
export type UsageExplanationResponseSchemaType = Static<typeof UsageExplanationResponseSchema>;