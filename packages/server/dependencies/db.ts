// Make sure to install the 'pg' package 
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from "pg";

class DB {
    constructor() { this.init(); }

    private _db: ReturnType<typeof drizzle> | null = null;
    private _pool: Pool | null = null;

    public init() {
        this._pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
        this._db = drizzle(this._pool);
    }

    public get db(): ReturnType<typeof drizzle> {
        if (!this._db) {
            throw new Error('Database not initialized');
        }
        return this._db;
    }

    public stop() {
        if (this._pool) {
            this._pool.end();
            this._pool = null;
            this._db = null;
            console.log("DB Connection closed");
        }
    }
}

export default new DB();