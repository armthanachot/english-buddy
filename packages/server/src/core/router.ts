import Elysia from "elysia";
import CoreService from "./service";
import { CreateUserConversationRequestSchema, type CreateUserConversationRequest } from "shared/model/core/req";
import { CreateUserConversationResponseSchema } from "shared/model/core/res";

const CoreRouter = new Elysia({
    prefix: "/core"
})
    .post("/create-user-conversation", async ({ body }) => {
        return await CoreService.createConversationId(body.userId);
    }, {
        body: CreateUserConversationRequestSchema,
        response: CreateUserConversationResponseSchema,
    })
export default CoreRouter;