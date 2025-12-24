import { Type as t, type Static } from "@sinclair/typebox";
import { ResSchema } from "../response";

export const CreateUserResponseSchema = ResSchema(t.Object({
    id: t.String(),
}));

export const GetAllUserResponseSchema = ResSchema(t.Array(t.Object({
    id: t.String(),
    name: t.String(),
    email: t.String(),
})));

export const GetUserByIdResponseSchema = ResSchema(t.Object({
    id: t.String(),
    name: t.String(),
    email: t.String(),
    conversations: t.Array(t.Object({
        conversationId: t.String(),
        type: t.String(),
    })),
}));

export type CreateUserResponse = Static<typeof CreateUserResponseSchema>;
export type GetAllUserResponse = Static<typeof GetAllUserResponseSchema>;
export type GetUserByIdResponse = Static<typeof GetUserByIdResponseSchema>;