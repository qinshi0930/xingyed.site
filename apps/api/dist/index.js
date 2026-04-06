"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_server_1 = require("@hono/node-server");
const hono_1 = require("hono");
const cors_1 = require("hono/cors");
const blog_1 = __importDefault(require("./routes/blog"));
const app = new hono_1.Hono();
app.use('/*', (0, cors_1.cors)());
app.route('/api/blog', blog_1.default);
app.get('/', (c) => {
    return c.text('Hello Hono!');
});
const port = Number(process.env.PORT) || 3001;
(0, node_server_1.serve)({
    fetch: app.fetch,
    port
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
});
