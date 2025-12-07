# Config Mono Repo

1. create project `english-buddy`
2. cd `english-buddy`
3. `bun init -y`
4. `mkdir packages`
5. `english-buddy/package.json`
```jsonc
{
    //...
    "workspaces": [
    "packages/*"
  ],
    //...
}
```
6. `mkdir packages/shared`
7. `cd packages/shared`
8. `bun init -y`
9. `packages/shared/package.json`
```jsonc
{
    //...
    "exports": { //ตรงนี้ หากมีการแยก folder หรือ แยกไฟล์ ใน packages ต้องมา export เพิ่ม เช่น `"utils":"./pkg/utils/*.ts"`
        ".": "./index.ts" //ใช้ . แปลว่า ตอน import ก็แค่ {...} from "shared" และถ้าจะแยก file หรือ folder ออกไป ก็ใช้ ./ นำหน้า path ที่ต้องการ
    }
    //...
}
```
10. create example type in `packages/shared/index.ts`
```ts
// packages/shared/index.ts
export type User = {
  id: string;
  name: string;
  role: 'admin' | 'user';
};

export const API_PREFIX = '/api';
```
11. create server
    - cd to root `english-buddy`
    - mkdir packages/server
    - cd `packages/server`
    - `bun add elysia`
    - `bun add "shared@workspace:*"`
    - `packages/server/src/index.ts`
        ```ts
        // packages/server/src/index.ts
        import { Elysia } from 'elysia';
        import { User, API_PREFIX } from 'shared'; // Import Type และตัวแปรจาก shared

        const userExample: User = {
        id: 'u001',
        name: 'Bun User',
        role: 'admin',
        };

        const app = new Elysia()
        .get('/', () => 'Hello from Elysia Backend!')
        .get(`${API_PREFIX}/user`, () => userExample as User) // ใช้ API_PREFIX และ Type
        .listen(8080);

        console.log(
        `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
        );
        ```
12. create client
    - cd to root `english-buddy`
    - cd packages
    - bun create vite client --template react-ts
    - cd client
    - `bun add "shared@workspace:*"`
    - set proxy `packages/client/vite.config.ts`
        ```ts
            // packages/client/vite.config.ts
            import { defineConfig } from 'vite';
            import react from '@vitejs/plugin-react';

            export default defineConfig({
            plugins: [react()],
            server: {
                port: 3000,
                proxy: {
                '/api': { // ทุก Request ที่ขึ้นต้นด้วย /api จะถูกส่งไปที่ Elysia
                    target: 'http://localhost:8080', // ที่อยู่ของ Elysia
                    changeOrigin: true,
                    secure: false,
                },
                },
            },
            });
        ```
    - using shared type `packages/client/src/App.tsx`
        ```ts
            // packages/client/src/App.tsx
            import { useState, useEffect } from 'react';
            import reactLogo from './assets/react.svg';
            import viteLogo from '/vite.svg';
            import './App.css';
            import { User, API_PREFIX } from 'shared'; // Import Type และตัวแปรจาก shared

            function App() {
            const [backendUser, setBackendUser] = useState<User | null>(null);

            useEffect(() => {
                fetch(`${API_PREFIX}/user`) // ใช้ API_PREFIX และ Proxy
                .then((res) => res.json())
                .then((data: User) => {
                    setBackendUser(data);
                });
            }, []);

            return (
                <>
                <div>
                    <a href="https://vitejs.dev" target="_blank">
                    <img src={viteLogo} className="logo" alt="Vite logo" />
                    </a>
                    <a href="https://react.dev" target="_blank">
                    <img src={reactLogo} className="logo react" alt="React logo" />
                    </a>
                </div>
                <h1>Bun Monorepo Demo</h1>
                {backendUser ? (
                    <div className="card">
                    <h2>Data from Elysia Backend:</h2>
                    <p>ID: **{backendUser.id}**</p>
                    <p>Name: **{backendUser.name}**</p>
                    <p>Role (Shared Type): **{backendUser.role}**</p>
                    </div>
                ) : (
                    <p>Loading backend data...</p>
                )}
                </>
            );
            }

            export default App;
        ```
13. cd to root `english-buddy`
    - bun install
    - bun dev