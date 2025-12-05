import Elysia from "elysia";
import TranslatorService from "./service";
import { SituationRequestSchema, TranslateRequestSchema, type SituationRequest, type TranslateRequest } from "./model/req";
import { SituationResponseSchema, TranslateResponseSchema } from "./model/res";

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
    });

export default TranslatorRouter;