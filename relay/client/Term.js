export function Term(socket) {
    let events = {};
    this.on = (name, cb) => {
        if (!events[name]) {
            events[name] = [];
        }
        events[name].push(cb);
    };

    this.connect = (id) => {
        channel.emit("subscribe", { id });
    };

    this.Terminal = function () {
        let channel = socket.createChannel();
        channel.emit("session");

        let el = document.createElement("div");
        el.style.width = "100%";
        el.style.height = "100%";
        let term = new window.Terminal({
            cursorBlink: true,
            convertEol: true,
            screenReaderMode: true,
            scrollback: 1000,
        });
        let fitAddon = new FitAddon.FitAddon();
        term.loadAddon(fitAddon);
        term.open(el);
        term.write(`Connected`);
        term.write(`\r`);
        term.onResize((evt) => {
            channel.emit(
                "resize",
                Object.assign(
                    {
                        pixel_height: 0,
                        pixel_width: 0,
                    },
                    evt
                )
            );
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

        term.onData((e) => {
            channel.emit("command", { data: e });
        });
        channel.on("response", ({ data }) => {
            term.write(data);
        });
        return el;
    };

    this.Interface = function () {
        let channel = socket.createChannel();
        let hostname = "";
        let cbs = [];
        let commandSent = false;
        let onConnect;
        let ready = false;
        channel.emit("session");

        this.run = (command) => {
            commandSent = true;
            collect = false;
            channel.emit("command", { data: command + "\n" });
            return new Promise((resolve) => {
                cbs.push(resolve);
            });
        };
        this.onConnect = (f) => {
            onConnect = f;
        };
        let collector = "";
        let collect = false;
        channel.on("response", (data) => {
            console.log(data);
            if (hostname == "" && !ready) {
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
            } else if (hostname != "" && ready) {
                if (commandSent) {
                    if (collect) {
                        collector += removeANSIEscapeCodes(data.data);
                    }
                    if (data.data.indexOf("[?2004") != -1) {
                        if (collect) {
                            collect = false;
                            let hN = collector.indexOf(hostname);
                            let tC = collector.indexOf("]0;");
                            let end = Math.min(
                                hN == -1 ? Infinity : hN,
                                tC == -1 ? Infinity : tC
                            );
                            if (end == -1) {
                                end = collector.length - 1;
                            }
                            cbs.shift()(collector.slice(0, end));
                            commandSent = false;
                            collector = "";
                        } else {
                            collect = true;
                        }
                    }
                }
            }
        });
    };

    this.read = (file) => {
        let channel = socket.createChannel();
        return new Promise((resolve) => {
            channel.emit("operation", {
                read: true,
                data: file,
            });
            channel.on("operation", ({ data }) => {
                channel.close();
                resolve(data);
            });
        });
    };

    this.write = (file, data) => {
        let channel = socket.createChannel();
        return new Promise((resolve) => {
            channel.emit("operation", {
                write: true,
                name: file,
                data,
            });
            channel.close();
            resolve({ sucess: true });
        });
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
