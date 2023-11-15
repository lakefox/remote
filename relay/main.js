import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import { FlowLayer } from "./client/FlowLayer.js";

const srcDir = "./client";

let connections = {};
let mappedConnections = {};

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

    let io = new FlowLayer(ws, true);

    io.on("open", (socket) => {
        let subscribedTo;
        console.log("Opened: ", socket.id);
        connections[socket.id] = socket;

        socket.on("subscribe", (data) => {
            console.log("Subscribing", mappedConnections);
            if (mappedConnections[data.org]) {
                let id = mappedConnections[data.org][data.id];
                console.log(id);
                if (id) {
                    console.log(connections);
                    if (connections[id]) {
                        subscribedTo = id;
                        console.log(
                            `${socket.id} sub'd to #${data.id} at ${data.org}`
                        );
                        // Add Fetch proxing
                        socket.route("*", (event, data) => {
                            console.log("Fetching: ", event);
                            return new Promise((resolve, reject) => {
                                connections[subscribedTo]
                                    .fetch(event, data)
                                    .then((res) => {
                                        resolve(res);
                                    });
                            });
                        });
                    }
                }
            }
        });

        socket.on("ident", (data) => {
            console.log("Start ident");
            if (mappedConnections[data.org] === undefined) {
                mappedConnections[data.org] = {};
            }
            mappedConnections[data.org][data.id] = data.ioID;
            console.log("IDENTED: ", data.id, data.org);
        });

        socket.on("channel", (channel) => {
            console.log("Channel Created", subscribedTo);
            if (subscribedTo) {
                if (connections[subscribedTo]) {
                    let pipeTo = connections[subscribedTo].createChannel();
                    console.log(subscribedTo, "making channel");
                    pipeTo.on("close", () => {
                        channel.close();
                    });

                    channel.catch(pipeTo.emit);
                    pipeTo.catch(channel.emit);

                    channel.on("close", () => {
                        if (connections[channel.id]) {
                            delete connections[channel.id];
                        }
                        pipeTo.close();
                    });
                }
            }
        });

        socket.on("close", () => {
            delete connections[socket.id];
            console.log("Closed");
        });
    });
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

await app.listen({ port: 2134 });
