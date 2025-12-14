import OpenAI from "openai";
import type { CreateUserConversationResponseSchemaType, DeleteUserConversationResponseSchemaType } from "shared/model/core/res";
import db from "../../dependencies/db";
import { drizzle } from 'drizzle-orm/node-postgres';
import { userConversationTable } from "../../schema/user_conversation";
import { userTable } from "../../schema/user";
import { and, eq } from "drizzle-orm";
import type { CreateUserConversationRequest, DeleteUserConversationRequest } from "shared/model/core/req";


class CoreService {
    private readonly openai: OpenAI;
    private  readonly _db: ReturnType<typeof drizzle>

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        this._db = db.db;
    }

    public async createConversationId(body: CreateUserConversationRequest): Promise<CreateUserConversationResponseSchemaType> {
        const { userId, type } = body;
        const user = await this._db.select().from(userTable).where(eq(userTable.id, userId))
        if (!user.length) {
            throw new Error("User not found");
        }

        const existingConversation = await this._db.select().from(userConversationTable).where(and(eq(userConversationTable.userId, userId), eq(userConversationTable.type, type), eq(userConversationTable.isActive, true)))
        if (existingConversation.length) {
            return { data: { conversationId: existingConversation[0]!.conversationId } }
        }

        const resp = await this.openai.conversations.create({
            metadata: {
                topic: `conversation__${type}__${userId}`
            },
        })
        

        await this._db.insert(userConversationTable).values({
            userId: userId,
            conversationId: resp.id,
            type: type,
        })

        return { data: { conversationId: resp.id } }
    }

    public async deleteConversationId(body: DeleteUserConversationRequest): Promise<DeleteUserConversationResponseSchemaType> {
        const user = await this._db.select().from(userTable).where(eq(userTable.id, body.userId))
        if (!user.length) {
            throw new Error("User not found");
        }

        await this._db.delete(userConversationTable).where(and(eq(userConversationTable.conversationId, body.conversationId), eq(userConversationTable.userId, body.userId), eq(userConversationTable.isActive, true)))

        return { data: { success: true } }
    }
}

export default new CoreService();