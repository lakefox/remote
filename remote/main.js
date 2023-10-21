import { StandardWebSocketClient } from "https://deno.land/x/websocket@v0.1.4/mod.ts";
import os from "https://deno.land/std@0.123.0/node/os.ts";
import { Pty } from "https://deno.land/x/deno_pty_ffi@0.15.1/mod.ts";

const ws = new StandardWebSocketClient("wss://ws.lakefox.net/wss");

console.log("Socket is up and running...");

let stats = [];

let sessions = [];
let serverId = null;

ws.on("open", () => {
    console.log("Connected");
    ws.send(JSON.stringify({ type: "server" }));

    // Send system information to the client every second
    setInterval(() => {
        const cpuUsage = Deno.loadavg();
        const systemInfo = {
            cpuUsage: cpuUsage[0],
            memoryUsage: (1 - os.freemem() / os.totalmem()) * 100,
            timestamp: Date.now(),
        };
        stats.push(systemInfo);
        send({
            type: "info",
            data: systemInfo,
        });
        if (stats.length > 100) {
            stats.shift();
        }
    }, 10000);
});

ws.on("message", async (raw) => {
    let data = JSON.parse(raw.data);
    if (data.type != "resize") {
        console.log(data);
    }
    if (data.type == "new") {
        console.log("new session");
        let id = sessions.length;
        let session = await createSession(id);
        sessions.push(session);
        waiter(sessions[id], id, () => {
            return false;
        });
        send({ type: "id", data: id });
    } else if (data.type == "command" && data.id != null) {
        console.log("COMMAND: ", data.data);
        await sessions[data.id].write(data.data);
    } else if (data.type == "connect") {
        console.log("connect");
        for (let i = 0; i < stats.length; i++) {
            send(
                {
                    type: "info",
                    data: stats[i],
                },
                data.id
            );
        }
    } else if (data.type == "socket-id") {
        serverId = data.id;
        console.log(serverId);
    } else if (data.type == "resize") {
        sessions[data.id].resize(data.data);
    } else if (data.type == "close") {
        //
        console.log("close");
    }
});

ws.on("error", console.error);

ws.on("close", () => {
    console.log("Closed");
    sessions = [];
});

function send(data, id = undefined) {
    ws.send(
        JSON.stringify({
            data,
            id,
            type: "emit",
        })
    );
}

async function createSession() {
    let shell;
    let env = Env(Deno.env.toObject());

    switch (os.platform()) {
        case "win32":
            shell = "powershell.exe";
            break;
        case "darwin":
            shell = "zsh";
            break;
        default:
            shell = "bash";
            break;
    }
    let ptyProcess = await Pty.create({
        cmd: shell,
        env: env,
        args: [],
    });
    if (shell == "zsh") {
        ptyProcess.write(
            `setopt PROMPT_CR && setopt PROMPT_SP && export PROMPT_EOL_MARK=""\r`
        );
        try {
            await (() => {
                return new Promise(async (resolve, reject) => {
                    let run = true;
                    let holder;
                    while (run) {
                        holder = setTimeout(() => {
                            run = false;
                            reject();
                        }, 200);
                        await ptyProcess.read();
                        clearTimeout(holder);
                    }
                });
            })();
        } catch (error) {
            console.log("created pty");
            ptyProcess.write("clear\r");
            return ptyProcess;
        }
    } else {
        console.log("created pty");
        return ptyProcess;
    }
}

function Env(obj) {
    let vars = [];
    for (const key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            vars.push([key, value]);
        }
    }
    return vars;
}

function waiter(pty, id, close) {
    return new Promise(async (resolve, reject) => {
        while (!close()) {
            let res = await pty.read();
            send({ type: "response", id, data: res });
        }
    });
}
