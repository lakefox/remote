import { Fmt, State, div, input, style, ul } from "../html.js";
import { TextEditor } from "./TextEditor.js";

let { val, listen, f, Global } = new State();

export class Pannel extends Global {
    constructor() {
        super();
        let cont = div`class="${css.pannel}"`;
        val("cont", cont);
        val("open", false);

        f(({ open }) => {
            if (open) {
                document.querySelector("#desktop").style.width =
                    "calc(100% - 700px)";
                document.querySelector("#pannel").style.width = "700px";
            } else {
                document.querySelector("#desktop").style.width = "100%";
                document.querySelector("#pannel").style.width = "0px";
            }
        });
        document.querySelector("#pannel").appendChild(cont);
    }
}

let css = style`
    .pannel {
        width: 100%;
        height: 100%;
        background: #0f0d15;
    }
`;
