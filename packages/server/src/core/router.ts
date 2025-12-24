import Elysia from "elysia";
import CoreService from "./service";
import { CreateUserConversationRequestSchema, DeleteUserConversationRequestSchema, SetUserConversationAvailableRequestSchema } from "shared/model/core/req";
import { CreateUserConversationResponseSchema, DeleteUserConversationResponseSchema, SetUserConversationAvailableResponseSchema } from "shared/model/core/res";

const CoreRouter = new Elysia({
    prefix: "/core"
})
    .post("/create-user-conversation", async ({ body }) => {
        return await CoreService.createConversationId(body);
    }, {
        body: CreateUserConversationRequestSchema,
        response: CreateUserConversationResponseSchema,
    })
    .post("/set-user-conversation-available", async ({ body }) => {
        return await CoreService.setUserConversationAvailable(body);
    }, {
        body: SetUserConversationAvailableRequestSchema,
        response: SetUserConversationAvailableResponseSchema,
    })
    .post("/delete-user-conversation", async ({ body }) => {
        return await CoreService.deleteUserConversation(body);
    }, {
        body: DeleteUserConversationRequestSchema,
        response: DeleteUserConversationResponseSchema,
    })
export default CoreRouter;