import Elysia from "elysia";
import TranslatorService from "./service";
import { KeywordDetectRequestSchema, SituationRequestSchema, TranslateRequestSchema, UsageExplanationRequestSchema, type KeywordDetectRequest, type SituationRequest, type TranslateRequest, type UsageExplanationRequest } from "shared/model/translator/req";
import { KeywordDetectResponseSchema, SituationResponseSchema, TranslateResponseSchema, UsageExplanationResponseSchema } from "shared/model/translator/res";

const TranslatorRouter = new Elysia({
    prefix: "/translator"
})
    .post("/translate", async ({ body }) => {
        return await TranslatorService.translate(body as TranslateRequest);
    }, {
        body: TranslateRequestSchema,
        response: TranslateResponseSchema,
    }).post("/situations", async ({ body }) => {
        return await TranslatorService.situation(body as SituationRequest);
    }, {
        body: SituationRequestSchema,
        response: SituationResponseSchema,
    }).post("/usage-explanation", async ({ body }) => {
        return await TranslatorService.usageExplanation(body as UsageExplanationRequest);
    }, {
        body: UsageExplanationRequestSchema,
        response: UsageExplanationResponseSchema,
    }).post("/keyword-detect", async ({ body }) => {
        return await TranslatorService.keywordDetect(body as KeywordDetectRequest);
    }, {
        body: KeywordDetectRequestSchema,
        response: KeywordDetectResponseSchema,
    });

export default TranslatorRouter;