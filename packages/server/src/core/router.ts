import Elysia from "elysia";
import CoreService from "./service";
import { CreateUserConversationRequestSchema, DeleteUserConversationRequestSchema, type CreateUserConversationRequest } from "shared/model/core/req";
import { CreateUserConversationResponseSchema, DeleteUserConversationResponseSchema } from "shared/model/core/res";

const CoreRouter = new Elysia({
    prefix: "/core"
})
    .post("/create-user-conversation", async ({ body }) => {
        return await CoreService.createConversationId(body);
    }, {
        body: CreateUserConversationRequestSchema,
        response: CreateUserConversationResponseSchema,
    })
    .post("/delete-user-conversation", async ({ body }) => {
        return await CoreService.deleteConversationId(body);
    }, {
        body: DeleteUserConversationRequestSchema,
        response: DeleteUserConversationResponseSchema,
    })
export default CoreRouter;