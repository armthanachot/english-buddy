import {t, type Static} from 'elysia'

export const FileUploadRequestSchema = t.Object({
    file: t.File(),
    targetLanguage: t.Union([t.Literal("TH"), t.Literal("EN"), t.Literal("JA"), t.Literal("ZH"), t.Literal("VI"), t.Literal("ID")]),
});

export type FileUploadRequestSchemaType = Static<typeof FileUploadRequestSchema>;