function Term(socket) {
    let events = {};
    this.on = (name, cb) => {
        if (!events[name]) {
            events[name] = [];
        }
        events[name].push(cb);
    };
    socket.addEventListener("open", () => {
        emit("open");
    });

    let connectId = null;

    this.connect = (id) => {
        connectId = id;
        socket.send(JSON.stringify({ type: "subscribe", id }));
    };

    this.Terminal = function (el) {
        let id = null;
        let term = new window.Terminal({
            cursorBlink: true,
        });
        const fitAddon = new FitAddon.FitAddon();
        term.loadAddon(fitAddon);
        term.open(el);

        let command = "";

        send({ type: "new" });

        if (term._initialized) {
            return;
        }

        term._initialized = true;

        term.prompt = () => {
            term.write("\r\n$ ");
        };
        prompt(term);
        term.onData((e) => {
            switch (e) {
                case "\u0003": // Ctrl+C
                    term.write("^C");
                    prompt(term);
                    break;
                case "\r": // Enter
                    runCommand(command);
                    command = "";
                    break;
                case "\u007F": // Backspace (DEL)
                    // Do not delete the prompt
                    if (term._core.buffer.x > 2) {
                        term.write("\b \b");
                        if (command.length > 0) {
                            command = command.substring(0, command.length - 1);
                        }
                    }
                    break;
                case "\u0009":
                    console.log("tabbed", output, ["dd", "ls"]);
                    break;
                default:
                    if (
                        (e >= String.fromCharCode(0x20) &&
                            e <= String.fromCharCode(0x7e)) ||
                        e >= "\u00a0"
                    ) {
                        command += e;
                        term.write(e);
                    }
            }
        });
        function clearInput(command) {
            var inputLengh = command.length;
            console.log(term);
            for (var i = 0; i < inputLengh; i++) {
                term.write("\b \b");
            }
        }
        function prompt(term) {
            command = "";
        }

        function runCommand(command) {
            if (command.length > 0) {
                clearInput(command);
                send({
                    type: "command",
                    id,
                    data: command + "\n",
                });
                return;
            }
        }
        function send(data) {
            socket.send(JSON.stringify({ type: "emit", id: connectId, data }));
        }
        socket.addEventListener("message", ({ data }) => {
            data = JSON.parse(data);
            console.log(data);
            if (data.type == "id" && id == null) {
                id = data.data;
            } else if (data.type == "response" && data.id == id) {
                term.write(data.data);
            } else {
                emit(data.type, data.data);
            }
        });
    };

    function emit(event, ...args) {
        if (events[event]) {
            for (let i = 0; i < events[event].length; i++) {
                events[event][i](...args);
            }
        }
    }
}

// let this handle the socket connection data
