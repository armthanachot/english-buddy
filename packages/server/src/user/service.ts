import { drizzle } from 'drizzle-orm/node-postgres';
import db from '../../dependencies/db';
import type { CreateUserResponse, GetAllUserResponse } from 'shared/model/user/res';
import { userTable } from '../../schema/user';
import type { CreateUserRequest, GetAllUserQuery } from 'shared/model/user/req';

class User {
    private readonly _db: ReturnType<typeof drizzle>
    constructor() { this._db = db.db }

    public async getAllUser(query: GetAllUserQuery):Promise<GetAllUserResponse> {
        const resp = await this._db?.select().from(userTable).offset(query.offset).limit(query.limit)
        return {
            data: resp?.map((user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
            }))
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