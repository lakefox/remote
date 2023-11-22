import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import { FlowLayer } from "./client/FlowLayer.js";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { sha256 } from "https://denopkg.com/chiefbiiko/sha256@v1.0.0/mod.ts";
import {
    create,
    verify,
    getNumericDate,
} from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const db = new DB("./relay.db");

db.execute(`
    CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS packages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        author TEXT NOT NULL,
        systems TEXT NOT NULL,
        description TEXT NOT NULL,
        variables TEXT,
        install TEXT NOT NULL,
        start TEXT NOT NULL,
        status TEXT NOT NULL,
        script TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`);

const querys = {
    id: db.prepareQuery(`SELECT id FROM accounts WHERE email = (:email)`),
    createAccount: db.prepareQuery(
        `INSERT INTO accounts (id, password, email) VALUES (:id, :pwd_hash, :email)`
    ),
    login: db.prepareQuery(
        `SELECT id FROM accounts WHERE email = :email AND password = :pwd_hash`
    ),
    createScript: db.prepareQuery(
        `INSERT INTO packages (name, author, systems, description, variables, install, start, status, script) VALUES (:name, :author, :systems, :description, :variables, :install, :start, :status, :script)`
    ),
};

const srcDir = "./client";
const key = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-512" },
    true,
    ["sign", "verify"]
);

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
        let loggedIn = false;

        socket.route("create-account", async ({ email, password }) => {
            let pwd_hash = sha256(password, "utf8", "hex");
            // Generate a random alphanumeric string of length 10
            let id = querys.id.all({ email });
            console.log(id);
            if (id.length == 0) {
                id = makeid(10);
                querys.createAccount.execute({ id, pwd_hash, email });
                loggedIn = true;
                let token = await create(
                    { alg: "HS512", type: "JWT" },
                    {
                        iss: JSON.stringify({ email, pwd_hash }),
                        // 60 days
                        exp: getNumericDate(60 * 60 * 24 * 60),
                    },
                    key
                );
                return {
                    error: false,
                    token,
                    id: id[0][0],
                };
            } else {
                loggedIn = false;
                return {
                    error: true,
                    id: null,
                };
            }
        });

        socket.route("login", async (data) => {
            let { email, password } = data;
            let pwd_hash;
            if (data.token && !email && !password) {
                let jwt = await verify(data.token, key).catch(() => {});
                if (jwt) {
                    jwt = JSON.parse(jwt.iss);
                    email = jwt.email;
                    pwd_hash = jwt.pwd_hash;
                } else {
                    return {
                        error: true,
                        id: null,
                    };
                }
            } else {
                pwd_hash = sha256(password, "utf8", "hex");
            }
            let id = querys.login.all({ email, pwd_hash });
            console.log("Logged in", id.length > 0);
            let res = {
                error: true,
                id: null,
            };
            if (id.length > 0) {
                loggedIn = true;
                let token = await create(
                    { alg: "HS512", type: "JWT" },
                    {
                        iss: JSON.stringify({ email, pwd_hash }),
                        // 60 days
                        exp: getNumericDate(60 * 60 * 24 * 60),
                    },
                    key
                );
                res = {
                    error: false,
                    token,
                    id: id[0][0],
                };
            } else {
                loggedIn = false;
            }
            return res;
        });

        // name
        // system
        // description
        // variables
        // install
        // start
        // status
        // script

        socket.route("upload", (data) => {
            console.log(data);
            return new Promise((resolve, reject) => {
                querys.createScript.execute(data);
                resolve({ error: false });
            });
        });

        socket.route("getPackages", (amt = 5) => {
            const result = db.query(
                `SELECT * FROM packages ORDER BY created_at DESC LIMIT :amt`,
                { amt }
            );
            return result;
        });

        socket.route("getPackage", (id) => {
            console.log(id);
            const result = db.query(`SELECT * FROM packages WHERE id = :id`, {
                id,
            });
            console.log(result);
            return result;
        });

        socket.route("getENV", () => {
            const result = db.query(`SELECT variables FROM packages`);
            let all = [];
            result.forEach((env) => {
                all = all.concat(JSON.parse(env));
            });
            return all;
        });

        socket.on("subscribe", (data) => {
            console.log("Subscribing", mappedConnections);
            if (mappedConnections[data.org] && loggedIn) {
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
            loggedIn = false;
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

function makeid(length) {
    let result = "";
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
        counter += 1;
    }
    return result;
}

await app.listen({ port: 2134 });
