// packages/server/src/index.ts
import { Elysia } from 'elysia';
import TranslatorRouter from './translator/router';
import db from '../dependencies/db';
import UserRouter from './user/router';
import CoreRouter from './core/router';

const app = new Elysia({
  prefix: "api/v1"
}).onStart(() => {
  db.init();
}).onStop(() => {
  db.stop();
})
  .get('/', () => 'Hello from Elysia Backend!')
  .use(TranslatorRouter)
  .use(UserRouter)
  .use(CoreRouter)
  .listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);