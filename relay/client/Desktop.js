export function Desktop(main) {
    let windows = [];
    let minimised = [];
    this.new = function (el, className) {
        let app = new DesktopWindow(
            main,
            `Window ${windows.length}`,
            100 + windows.length * 40,
            100 + windows.length * 40,
            className
        );
        app.on("close", () => {
            const index = windows.indexOf(app);
            if (index !== -1) {
                windows.splice(index, 1);
            }
        });
        app.on("click", () => {
            bringToTop(windows, app);
        });
        app.on("minimise", () => {
            minimised.push(app);
            renderMinimised();
        });
        app.content.appendChild(el);
        windows.push(app);
        bringToTop(windows, app);
        this.title = app.title;
    };
    this.open = (i) => {
        minimised[i].open();
        minimised.splice(i, 1);
    };

    function bringToTop(windows, app) {
        let base =
            windows.reduce(
                (maxZIndex, window) =>
                    Math.max(maxZIndex, getTopChild(window.window)[0][0]),
                0
            ) + 1;
        raise(app.window, base);
    }
    function getTopChild(win) {
        let sorted = [win, ...win.querySelectorAll("*")].sort(
            (a, b) =>
                parseInt(getComputedStyle(b).zIndex) ||
                0 - parseInt(getComputedStyle(a).zIndex) ||
                0
        );
        return sorted.map((e) => [
            parseInt(getComputedStyle(e).zIndex) || 0,
            e,
        ]);
    }

    function raise(win, base) {
        let indexes = getTopChild(win);
        let btm = indexes.at(-1)[0];
        let offset = Math.abs(base - btm) + 1;
        let children = [win, ...win.querySelectorAll("*")];
        for (let i = 0; i < indexes.length; i++) {
            if (indexes[i][0] != 0) {
                children[children.indexOf(indexes[i][1])].style.zIndex =
                    indexes[i][0] + offset;
            }
        }
    }

    function renderMinimised() {
        let tab = document.querySelector("#tabs");
        tab.innerHTML = "";
        for (let i = 0; i < minimised.length; i++) {
            const element = minimised[i];
            let div = document.createElement("div");
            div.className = "tab";
            div.innerHTML = element.title();
            div.addEventListener("click", () => {
                minimised[i].open();
                minimised.splice(i, 1);
                renderMinimised();
            });
            tab.appendChild(div);
        }
    }
}

class DesktopWindow {
    #call(event, ...args) {
        if (this.events[event]) {
            for (let i = 0; i < this.events[event].length; i++) {
                this.events[event][i](...args);
            }
        }
    }
    constructor(container, title, x, y, className) {
        this.container = container;
        this.events = {};

        this.window = document.createElement("div");
        this.window.className = "window";
        if (className) {
            this.window.classList.add(className);
        }
        this.window.style.left = x + "px";
        this.window.style.top = y + "px";
        this.window.style.height = "400px";
        this.window.addEventListener("click", (e) => {
            this.#call("click", e);
        });

        this.style = this.window.style;

        const titleBar = document.createElement("div");
        titleBar.style.cursor = "move";
        titleBar.innerHTML = `<span>${title}<span>`;
        titleBar.className = "titleBar";

        this.title = (e) => {
            if (e) {
                titleBar.querySelector("span").innerHTML = e;
            } else {
                return titleBar.querySelector("span").innerHTML;
            }
        };
        titleBar.addEventListener("mousedown", this.startDrag.bind(this));

        const closeButton = document.createElement("button");
        closeButton.textContent = "X";
        closeButton.className = "closeButton";
        closeButton.addEventListener("click", this.close.bind(this));

        const maximise = document.createElement("button");
        maximise.innerHTML = "&square;";
        maximise.className = "maximise";
        this.maxed = false;
        let max = (e) => {
            if (!this.maxed) {
                this.window.style.width = "600px";
                this.window.style.height = "400px";
            } else {
                this.window.style.top = "40px";
                this.window.style.left = "90px";

                let contStyles = getComputedStyle(this.container);
                this.window.style.width =
                    parseInt(contStyles.width) - 180 + "px";
                this.window.style.height =
                    parseInt(contStyles.height) - 70 + "px";
            }

            this.#call("maximise", this.maxed, e);
        };

        maximise.addEventListener("click", (e) => {
            this.maxed = !this.maxed;
            max(e);
        });

        // Initialize the ResizeObserver
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === this.container) {
                    // The terminal container has been resized
                    if (this.maxed) {
                        max();
                    }
                }
            }
        });

        // Observe changes to the terminal container's size
        resizeObserver.observe(this.container);

        const minimise = document.createElement("button");
        minimise.textContent = "_";
        minimise.className = "minimise";
        minimise.addEventListener("click", (e) => {
            this.window.style.display = "none";
            this.#call("minimise", e);
        });

        const resizeHandle = document.createElement("div");
        resizeHandle.className = "resize-handle";
        resizeHandle.style.bottom = "0";
        resizeHandle.style.right = "0";
        resizeHandle.style.width = "20px";
        resizeHandle.style.height = "20px";
        resizeHandle.style.cursor = "se-resize";
        resizeHandle.addEventListener("mousedown", this.startResize.bind(this));

        const content = document.createElement("div");
        content.style.width = "100%";
        content.style.height = "calc(100% - 20px)";
        this.content = content;

        this.window.appendChild(titleBar);
        titleBar.appendChild(closeButton);
        titleBar.appendChild(maximise);
        titleBar.appendChild(minimise);
        this.window.appendChild(resizeHandle);
        this.window.appendChild(content);

        container.appendChild(this.window);
    }

    startDrag(e) {
        let offsetX, offsetY;
        e.preventDefault();
        document.onmousemove = (e) => {
            this.window.style.left = e.clientX - offsetX + "px";
            this.window.style.top = e.clientY - offsetY + "px";
        };
        document.onmouseup = () => {
            document.onmousemove = null;
            document.onmouseup = null;
        };
        offsetX = e.clientX - this.window.getBoundingClientRect().left;
        offsetY = e.clientY - this.window.getBoundingClientRect().top;
    }

    startResize(e) {
        let offsetX, offsetY, startWidth, startHeight;
        e.preventDefault();
        document.onmousemove = (e) => {
            const newWidth = startWidth + e.clientX - offsetX;
            const newHeight = startHeight + e.clientY - offsetY;
            this.window.style.width = newWidth + "px";
            this.window.style.height = newHeight + "px";
            this.#call("resize", newWidth, newHeight);
        };
        document.onmouseup = () => {
            document.onmousemove = null;
            document.onmouseup = null;
        };
        offsetX = e.clientX;
        offsetY = e.clientY;
        startWidth = this.window.offsetWidth;
        startHeight = this.window.offsetHeight;
    }

    close() {
        this.container.removeChild(this.window);
        this.#call("close");
    }

    open() {
        this.window.style.display = "block";
    }

    on(event, cb) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(cb);
    }
}
