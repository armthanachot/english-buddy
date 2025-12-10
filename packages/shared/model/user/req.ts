import { Type as t, type Static } from "@sinclair/typebox";


export const CreateUserRequestSchema = t.Object({
    name: t.String(),
    email: t.String(),
});

export const GetAllUserQuerySchema = t.Object({
    offset: t.Number({
        minimum:0
    }),
    limit: t.Number({
        minimum:1,
        maximum:100
    }),
})

export type CreateUserRequest = Static<typeof CreateUserRequestSchema>;
export type GetAllUserQuery = Static<typeof GetAllUserQuerySchema>;