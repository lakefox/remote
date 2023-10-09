import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";

const srcDir = Deno.cwd() + "/client";

let servers = {};
let connections = {};
console.log("Relay is up and running...");

const app = new Application();
const router = new Router();

// Logger middleware (optional)
app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.headers.get("X-Response-Time");
    console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});

router.get("/wss", (ctx) => {
    if (!ctx.isUpgradable) {
        ctx.throw(501);
    }
    const ws = ctx.upgrade();
    console.log("Request Upgraded");

    let id = parseInt(Math.random() * 100000);
    ws.onopen = () => {
        console.log("Opened: ", id);
        connections[id] = ws;
        ws.send(JSON.stringify({ type: "socket-id", id }));
    };
    ws.onmessage = (raw) => {
        let data = JSON.parse(raw.data);
        console.log("Request: ", data);
        console.log("Servers: ", servers);
        console.log("Connections: ", Object.keys(connections));
        if (data.type == "server") {
            servers[id] = [];
        } else if (data.type == "subscribe" && servers[data.id]) {
            servers[data.id].push(id);
            connections[data.id].send(JSON.stringify({ type: "connect", id }));
        } else if (data.type == "emit") {
            if (data.id) {
                connections[data.id].send(JSON.stringify(data.data));
                console.log("Sent Direct: ", data.id);
            } else {
                servers[id].forEach((connection) => {
                    connections[connection].send(JSON.stringify(data.data));
                    console.log("Sent Mass: ", connection);
                });
            }
        }
    };
    ws.onclose = () => {
        // delete connections[id];
        // delete servers[id];
        console.log("Closed");
        // ws.send(JSON.stringify({ type: "close", id }));
    };
});

app.use(router.routes());
app.use(router.allowedMethods());

// Serve static files
app.use(async (ctx) => {
    const path = ctx.request.url.pathname;
    console.log(path);
    if (path != "/wss") {
        const file_path = `${srcDir}${path}`;
        try {
            const fileInfo = await Deno.stat(file_path);
            if (fileInfo && fileInfo.isFile) {
                await send(ctx, path, {
                    root: srcDir,
                });
            } else if (fileInfo && fileInfo.isDirectory) {
                await send(ctx, path + "index.html", {
                    root: srcDir,
                });
            }
        } catch (error) {
            // Handle file not found errors or other errors here
            console.error(error);
            ctx.response.status = 404;
            ctx.response.body = "Not Found";
        }
    }
});

await app.listen({ port: 8080 });
