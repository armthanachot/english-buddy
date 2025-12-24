import Elysia, { t } from "elysia";
import User from "./service";
import { CreateUserRequestSchema, GetAllUserQuerySchema, type CreateUserRequest, type GetAllUserQuery } from "shared/model/user/req";
import { CreateUserResponseSchema, GetAllUserResponseSchema, GetUserByIdResponseSchema } from "shared/model/user/res";

const UserRouter = new Elysia({
    prefix: "/user"
}).get("", async ({ query }) => {
    return await User.getAllUser(query as GetAllUserQuery);
}, {
    query: GetAllUserQuerySchema,
    response: GetAllUserResponseSchema,
})
    .get("/:id", async ({ params }) => {
        return await User.getUserById(params.id as string);
    }, {
        params: t.Object({
            id: t.String(),
        }),
        response: GetUserByIdResponseSchema,
    })
    .post("", async ({ body }) => {
        return await User.createUser(body as CreateUserRequest);
    }, {
        body: CreateUserRequestSchema,
        response: CreateUserResponseSchema,
    })

export default UserRouter;