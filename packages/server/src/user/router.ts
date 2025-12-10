import Elysia from "elysia";
import User from "./service";
import { CreateUserRequestSchema, GetAllUserQuerySchema, type CreateUserRequest, type GetAllUserQuery } from "shared/model/user/req";
import { CreateUserResponseSchema, GetAllUserResponseSchema } from "shared/model/user/res";

const UserRouter = new Elysia({
    prefix: "/user"
}).get("", async ({ query }) => {
    return await User.getAllUser(query as GetAllUserQuery);
}, {
    query: GetAllUserQuerySchema,
    response: GetAllUserResponseSchema,
})
    .post("", async ({ body }) => {
        return await User.createUser(body as CreateUserRequest);
    }, {
        body: CreateUserRequestSchema,
        response: CreateUserResponseSchema,
    })

export default UserRouter;