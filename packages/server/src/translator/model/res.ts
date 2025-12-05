import { t, type Static } from "elysia";
import { ResSchema } from "../../../model/response";

export const TranslateResponseSchema = ResSchema(t.Object({
    translatedText: t.String(),
}))

export const SituationResponseSchema = ResSchema(t.Array(t.Object({
    situation: t.String(),
    translatedSituation: t.String(),
})))

export type TranslateResponseSchemaType = Static<typeof TranslateResponseSchema>;
export type SituationResponseSchemaType = Static<typeof SituationResponseSchema>;