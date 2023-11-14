import os from "https://deno.land/std@0.123.0/node/os.ts";
import { parse } from "https://deno.land/std@0.204.0/flags/mod.ts";
import { Pty } from "https://deno.land/x/deno_pty_ffi@0.15.1/mod.ts";
import { FlowLayer } from "../../relay/client/FlowLayer.js";

// ./remote --org=automated --id=1

function main(args) {
    const ws = new WebSocket("wss://ws.lakefox.net/wss");
    let io = new FlowLayer(ws);
    console.log("Socket is up and running...");

    io.on("open", (socket) => {
        console.log("Connected", io.id);
        socket.emit("ident", {
            org: args.org,
            id: args.id,
            ioID: io.id,
        });
        socket.on("channel", (channel) => {
            let closed = false;
            let session;
            console.log("Channel Created");

            channel.on("resize", (data) => {
                if (session) {
                    session.resize(data);
                }
            });

            channel.on("session", async () => {
                session = await createSession();
                waiter(() => {
                    return closed;
                });
            });

            channel.on("command", async (data) => {
                console.log("COMMAND: ", data.data);
                if (session) {
                    await session.write(data.data);
                }
            });

            channel.on("operation", async (data) => {
                if (data.write) {
                    console.log("WRITE: ", data.name);
                    await Deno.writeTextFile(data.name, data.data);
                } else if (data.read) {
                    console.log("READ: ", data.data);
                    let file = await Deno.readTextFile(data.data);
                    channel.emit("operation", {
                        read: true,
                        name: data.data,
                        data: file,
                    });
                }
            });

            channel.on("close", () => {
                console.log("CLose");
                closed = true;
            });

            function waiter(close) {
                return new Promise(async (resolve, reject) => {
                    while (!close()) {
                        let res = await session.read();
                        channel.emit("response", { data: res });
                    }
                });
            }
        });

        socket.on("close", () => {
            console.log("Closed");
            main(args);
        });
    });
}
let args = parse(Deno.args);
console.log(args);
main(args);

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
                        }, 100);
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
