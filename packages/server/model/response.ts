import { t, type TSchema } from "elysia";

export const ResSchema = <T extends TSchema>(data: T) => t.Object({
    data: t.Optional(data),
    success: t.Optional(t.Boolean({
        default: true
    })),
    message: t.Optional(t.String()),
    error: t.Optional(t.String()),
})