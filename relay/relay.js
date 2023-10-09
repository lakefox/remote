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

    let id = parseInt(Math.random() * 100000);
    ws.onopen = () => {
        console.log("Open");
        connections[id] = ws;
        ws.send(JSON.stringify({ type: "socket-id", id }));
    };
    ws.onmessage = (raw) => {
        let data = JSON.parse(raw.data);
        console.log(data, servers);
        if (data.type == "server") {
            servers[id] = [];
        } else if (data.type == "subscribe" && servers[data.id]) {
            servers[data.id].push(id);
            connections[data.id].send(JSON.stringify({ type: "connect", id }));
        } else if (data.type == "emit") {
            if (data.id) {
                connections[data.id].send(JSON.stringify(data.data));
            } else {
                servers[id].forEach((connection) => {
                    connections[connection].send(JSON.stringify(data.data));
                    console.log("sent: ", connection);
                });
            }
        }
    };
    ws.onclose = () => {
        delete connections[id];
        delete servers[id];
        ws.send(JSON.stringify({ type: "close", id }));
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
        console.log("fp", file_path);
        try {
            const fileInfo = await Deno.stat(file_path);
            console.log(fileInfo);
            if (fileInfo && fileInfo.isFile) {
                await send(ctx, path, {
                    root: srcDir,
                });
            } else if (fileInfo && fileInfo.isDirectory) {
                console.log(path + "index.html");
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

await app.listen({ port: 2134 });
