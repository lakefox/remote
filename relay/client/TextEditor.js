import { div, style } from "./html.js";
import { extMap } from "./fileTools.js";

export class TextEditor {
    constructor() {
        this.html = div`class="${css.editor}"`;
    }
    init() {
        let self = this;

        require(["vs/editor/editor.main"], function () {
            self.editor = monaco.editor.create(self.html, {
                value: "",
                language: "javascript",
                theme: "vs-dark", // You can change the theme
            });
            // Initialize the ResizeObserver
            const resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    if (entry.target === self.html) {
                        // The terminal container has been resized
                        self.editor.layout();
                    }
                }
            });

            // Observe changes to the terminal container's size
            resizeObserver.observe(self.html);
        });
    }
    load(lang, code) {
        // Set the new code
        this.editor.getModel().setValue(code);

        // Set the new language
        monaco.editor.setModelLanguage(
            this.editor.getModel(),
            extMap[lang] || "text"
        );
    }
}

let css = style`
    .editor {
        width: 100%;
        height: 100%;
    }
`;
