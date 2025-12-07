import Elysia from "elysia";
import TranslatorService from "./service";
import { SituationRequestSchema, TranslateRequestSchema, UsageExplanationRequestSchema, type SituationRequest, type TranslateRequest, type UsageExplanationRequest } from "shared/model/translator/req";
import { SituationResponseSchema, TranslateResponseSchema, UsageExplanationResponseSchema } from "shared/model/translator/res";

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
    });

export default TranslatorRouter;