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

    this.Terminal = function () {
        let el = document.createElement("div");
        el.style.width = "100%";
        el.style.height = "100%";
        let id = null;
        let term = new window.Terminal({
            cursorBlink: true,
            convertEol: true,
            screenReaderMode: true,
            scrollback: 1000,
        });
        let fitAddon = new FitAddon.FitAddon();
        term.loadAddon(fitAddon);
        term.open(el);
        term.write(`Connected to: ${connectId}`);
        term.write(`\r`);
        term.onResize((evt) => {
            if (id != undefined) {
                send({
                    type: "resize",
                    id,
                    data: Object.assign(
                        {
                            pixel_height: 0,
                            pixel_width: 0,
                        },
                        evt
                    ),
                });
            }
        });

        // Initialize the ResizeObserver
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === el) {
                    // The terminal container has been resized
                    fitAddon.fit();
                }
            }
        });

        // Observe changes to the terminal container's size
        resizeObserver.observe(el);

        send({ type: "new" });

        term.onData((e) => {
            send({
                type: "command",
                id,
                data: e,
            });
        });
        function send(data) {
            socket.send(JSON.stringify({ type: "emit", id: connectId, data }));
        }
        socket.addEventListener("message", ({ data }) => {
            data = JSON.parse(data);
            if (data.type == "id" && id == null) {
                id = data.data;
            } else if (data.type == "response" && data.id == id) {
                term.write(data.data);
            } else {
                emit(data.type, data.data);
            }
        });
        return el;
    };

    this.Interface = function () {
        let id = null;
        let hostname = "";
        let cbs = [];
        let commandSent = false;
        let onConnect;
        let ready = false;
        send({ type: "new" });
        this.run = (command) => {
            commandSent = true;
            collect = false;
            send({
                type: "command",
                id,
                data: command + "\n",
            });
            return new Promise((resolve) => {
                cbs.push(resolve);
            });
        };
        this.onConnect = (f) => {
            onConnect = f;
        };
        let collector = "";
        let collect = false;
        socket.addEventListener("message", ({ data }) => {
            data = JSON.parse(data);
            if (data.type == "id" && id == null) {
                id = data.data;
            } else if (
                data.type == "response" &&
                hostname == "" &&
                !ready &&
                data.id == id
            ) {
                let str = removeANSIEscapeCodes(data.data).match(
                    /[A-Za-z0-9]+\@[A-Za-z0-9]+/i
                );
                if (str != null) {
                    hostname = str[0];
                    ready = true;
                    if (onConnect) {
                        onConnect();
                    }
                }
            } else if (data.type == "response" && hostname != "" && ready) {
                if (data.type == "response" && data.id == id && commandSent) {
                    if (data.data.indexOf("[?2004") != -1) {
                        if (collect) {
                            collect = false;
                            let end = collector.indexOf(hostname);
                            if (end == -1) {
                                end = collector.length - 1;
                            }
                            cbs.shift()(collector.slice(0, end));
                            commandSent = false;
                            collector = "";
                        } else {
                            collect = true;
                        }
                    } else if (collect) {
                        collector += removeANSIEscapeCodes(data.data);
                    }
                }
            }
        });
        function send(data) {
            socket.send(JSON.stringify({ type: "emit", id: connectId, data }));
        }
    };

    function emit(event, ...args) {
        if (events[event]) {
            for (let i = 0; i < events[event].length; i++) {
                events[event][i](...args);
            }
        }
    }
    function removeANSIEscapeCodes(inputString) {
        // Regular expression to match ANSI escape codes
        const ansiEscapeCodeRegex = /(\x9B|\x1B\[)[0-?]*[ -\/]*[@-~]/g;

        // Replace ANSI escape codes with an empty string
        return inputString.replace(ansiEscapeCodeRegex, "");
    }
}

// let this handle the socket connection data
