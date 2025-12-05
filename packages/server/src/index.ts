// packages/server/src/index.ts
import { Elysia } from 'elysia';
import { type User, API_PREFIX } from 'shared'; // Import Type และตัวแปรจาก shared
import TranslatorRouter from './translator/router';

const userExample: User = {
  id: 'u001',
  name: 'Bun User',
  role: 'admin',
};

const app = new Elysia({
  prefix:"api/v1"
})
  .get('/', () => 'Hello from Elysia Backend!')
  .use(TranslatorRouter)
  // .get(`${API_PREFIX}/user`, () => userExample as User) // ใช้ API_PREFIX และ Type
  .listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);