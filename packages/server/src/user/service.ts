import { drizzle } from 'drizzle-orm/node-postgres';
import db from '../../dependencies/db';
import type { CreateUserResponse, GetAllUserResponse, GetUserByIdResponse } from 'shared/model/user/res';
import { userTable } from '../../schema/user';
import type { CreateUserRequest, GetAllUserQuery } from 'shared/model/user/req';
import { eq } from 'drizzle-orm';
import { userConversationTable } from '../../schema/user_conversation';

class User {
    private readonly _db: ReturnType<typeof drizzle>
    constructor() { this._db = db.db }

    public async getAllUser(query: GetAllUserQuery): Promise<GetAllUserResponse> {
        const resp = await this._db?.select().from(userTable).offset(query.offset).limit(query.limit)
        return {
            data: resp?.map((user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
            }))
        }
    }
    public async getUserById(id: string): Promise<GetUserByIdResponse> {

        const result = await this._db?.select().from(userTable).where(eq(userTable.id, id)).leftJoin(userConversationTable, eq(userTable.id, userConversationTable.userId))
        if (!result.length) {
            throw new Error("User not found");
        }

        const [user] = result;
        if (!user) {
            throw new Error("User not found");
        }

        const { users: userInfo } = user;
        return {
            data: {
                id: userInfo.id,
                name: userInfo.name,
                email: userInfo.email,
                conversations: result.map((userResult) => ({
                    conversationId: userResult.user_conversations?.conversationId!,
                    type: userResult.user_conversations?.type!,
                })),
            }
        }
    }

    public async createUser(body: CreateUserRequest): Promise<CreateUserResponse> {

        const resp = await this._db?.insert(userTable).values({
            email: body.email,
            name: body.name,
        }).returning({ id: userTable.id })

        return {
            data: {
                id: resp?.[0]?.id!
            }
        }
    }
}

export default new User();