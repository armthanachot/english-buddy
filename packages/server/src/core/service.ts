import OpenAI from "openai";
import type { CreateUserConversationResponseSchemaType } from "shared/model/core/res";
import db from "../../dependencies/db";
import { drizzle } from 'drizzle-orm/node-postgres';
import { userConversationTable } from "../../schema/user_conversation";
import { userTable } from "../../schema/user";
import { eq } from "drizzle-orm";


class CoreService {
    private readonly openai: OpenAI;
    private  readonly _db: ReturnType<typeof drizzle>

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        this._db = db.db;
    }

    public async createConversationId(userId: string): Promise<CreateUserConversationResponseSchemaType> {
        const user = await this._db.select().from(userTable).where(eq(userTable.id, userId))
        if (!user.length) {
            throw new Error("User not found");
        }

        const resp = await this.openai.conversations.create({
            metadata: {
                topic: `conversation_${userId}`
            },
        })

        await this._db.insert(userConversationTable).values({
            userId: userId,
            conversationId: resp.id,
        })

        return { data: { conversationId: resp.id } }

    }
}

export default new CoreService();