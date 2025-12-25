import OpenAI from "openai";
import type { ClearAllConversationResponseSchemaType, CreateUserConversationResponseSchemaType, DeleteUserConversationResponseSchemaType, SetUserConversationAvailableResponseSchemaType } from "shared/model/core/res";
import db from "../../dependencies/db";
import { drizzle } from 'drizzle-orm/node-postgres';
import { userConversationTable } from "../../schema/user_conversation";
import { userTable } from "../../schema/user";
import { and, eq } from "drizzle-orm";
import type { ClearAllConversationRequest, CreateUserConversationRequest, DeleteUserConversationRequest, SetUserConversationAvailableRequest } from "shared/model/core/req";


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

    public async setUserConversationAvailable(body: SetUserConversationAvailableRequest): Promise<SetUserConversationAvailableResponseSchemaType> {
        const user = await this._db.select().from(userTable).where(eq(userTable.id, body.userId))
        if (!user.length) {
            throw new Error("User not found");
        }

        const existingConversation = await this._db.select().from(userConversationTable).where(and(eq(userConversationTable.conversationId, body.conversationId), eq(userConversationTable.userId, body.userId)))
        if (!existingConversation.length) {
            throw new Error("Conversation not found");
        }

        const [conversation] = existingConversation;
        if (!conversation) {
            throw new Error("Conversation not found");
        }

        const status = conversation.isActive ? false : true;

        await this._db.update(userConversationTable).set({ isActive: status }).where(eq(userConversationTable.id, conversation.id))

        return { data: { success: true } }
    }

    public async deleteUserConversation(body: DeleteUserConversationRequest): Promise<DeleteUserConversationResponseSchemaType> {
        const user = await this._db.select().from(userTable).where(eq(userTable.id, body.userId))
        if (!user.length) {
            throw new Error("User not found");
        }

        const existingConversation = await this._db.select().from(userConversationTable).where(and(eq(userConversationTable.conversationId, body.conversationId), eq(userConversationTable.userId, body.userId)))
        if (!existingConversation.length) {
            throw new Error("Conversation not found");
        }

        const [conversation] = existingConversation;
        if (conversation?.isActive) {
            throw new Error("Conversation is active cannot be deleted");
        }

        await this._db.update(userConversationTable).set({ deletedAt: new Date() }).where(eq(userConversationTable.id, conversation!.id))

        await this.openai.delete(conversation!.conversationId)
        return { data: { success: true } }
    }

    public async clearAllConversation(body: ClearAllConversationRequest): Promise<ClearAllConversationResponseSchemaType> {
        const { userId, conversationType } = body;
        const user = await this._db.select().from(userTable).where(eq(userTable.id, userId))
        if (!user.length) {
            throw new Error("User not found");
        }

        const conversations = await this._db.select().from(userConversationTable).where(and(eq(userConversationTable.userId, userId), eq(userConversationTable.type, conversationType)))
        if (!conversations.length) {
            throw new Error("Conversation not found");
        }

        const [conversation] = conversations;

        console.log(conversation!.conversationId);
        

        const conversationItems = await this.openai.conversations.items.list(conversation!.conversationId, {
            limit: 100,
        })

        for (const item of conversationItems.data) {
            await this.openai.conversations.items.delete(item.id!, {
                conversation_id: conversation!.conversationId,
            })
        }

        return { data: { success: true } }
    }

}

export default new CoreService();