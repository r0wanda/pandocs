import Api from './Api.mjs';
import env from 'dotenv';
env.config();

const api = new Api();
await api.init();