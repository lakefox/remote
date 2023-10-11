class DesktopWindow {
    #call(event, ...args) {
        if (this.events[event]) {
            for (let i = 0; i < this.events[event].length; i++) {
                this.events[event][i](...args);
            }
        }
    }
    constructor(container, title, x, y) {
        this.container = container;
        this.events = {};

        this.window = document.createElement("div");
        this.window.className = "window";
        this.window.style.left = x + "px";
        this.window.style.top = y + "px";

        const titleBar = document.createElement("div");
        titleBar.style.cursor = "move";
        titleBar.textContent = title;
        titleBar.className = "titleBar";
        titleBar.addEventListener("mousedown", this.startDrag.bind(this));

        const closeButton = document.createElement("button");
        closeButton.textContent = "X";
        closeButton.className = "closeButton";
        closeButton.addEventListener("click", this.close.bind(this));

        const resizeHandle = document.createElement("div");
        resizeHandle.className = "resize-handle";
        resizeHandle.style.bottom = "0";
        resizeHandle.style.right = "0";
        resizeHandle.style.width = "20px";
        resizeHandle.style.height = "20px";
        resizeHandle.style.cursor = "se-resize";
        resizeHandle.addEventListener("mousedown", this.startResize.bind(this));

        const content = document.createElement("div");
        content.className = "content";
        content.style.width = "100%";
        this.content = content;

        this.window.appendChild(titleBar);
        titleBar.appendChild(closeButton);
        this.window.appendChild(resizeHandle);
        this.window.appendChild(content);

        container.appendChild(this.window);
    }

    startDrag(e) {
        let offsetX, offsetY;
        e.preventDefault();
        document.onmousemove = (e) => {
            if (
                e.target === this.window ||
                e.target === this.window.querySelector("div")
            ) {
                this.window.style.left = e.clientX - offsetX + "px";
                this.window.style.top = e.clientY - offsetY + "px";
            }
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

    on(event, cb) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(cb);
    }
}
