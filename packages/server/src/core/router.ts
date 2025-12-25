import Elysia from "elysia";
import CoreService from "./service";
import { ClearAllConversationRequestSchema, CreateUserConversationRequestSchema, DeleteUserConversationRequestSchema, SetUserConversationAvailableRequestSchema } from "shared/model/core/req";
import { ClearAllConversationResponseSchema, CreateUserConversationResponseSchema, DeleteUserConversationResponseSchema, SetUserConversationAvailableResponseSchema } from "shared/model/core/res";
import { ResSchema } from "../../../shared/model/response";

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
    .post("/clear-all-conversation", async ({ body }) => {
        return await CoreService.clearAllConversation(body);
    }, {
        body: ClearAllConversationRequestSchema,
        response: ClearAllConversationResponseSchema,
    })
export default CoreRouter;