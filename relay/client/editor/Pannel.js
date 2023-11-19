import {
    Fmt,
    State,
    div,
    input,
    style,
    ul,
    h2,
    button,
    select,
    textarea,
    option,
} from "../html.js";

let st = new State();
let { val, listen, f, Global } = st;

export class Pannel extends Global {
    constructor() {
        super();
        let cont = div`class="${css.pannel}"`;
        val("cont", cont);
        val("open", false);
        val("showNew", false);
        val("search", "");
        val("name", "");
        val("os", "Linux");
        val("description", "");
        val("install", "");
        val("start", "");
        val("status", "");
        val("script", "");

        let searchBar =
            input`type="search" name="search" placeholder="Find a package"`.on(
                "keydown",
                (e) => {
                    if (e.key == "Enter") {
                        val("search", searchBar.value);
                    }
                }
            );

        let newButton = button`class="${css.new}" textContent="NEW"`.on(
            "click",
            () => {
                val("showNew", !val("showNew"));
            }
        );

        let main = Fmt`${div`class="${css.searchBar}"`}
                                ${searchBar}
                                ${div``}
                                    ${newButton}`;

        cont.appendChild(main);

        let newCont = Fmt`${div`class="${css.inputGroup}"`}
                                ${div`innerText="X" style="width: 100%;text-align:right;cursor:pointer;"`.on(
                                    "click",
                                    () => {
                                        val("showNew", false);
                                    }
                                )}
                                ${h2`innerText="Name"`}
                                ${input`class="${css.input}"`.bind(st, "name")}
                                ${h2`innerText="Supported OS's"`}
                                ${select`class="${css.input}"`.bind(st, "os")}
                                        ${option`value="MacOS" innerText="MacOs"`}
                                        ${option`value="Windows" innerText="Windows"`}
                                        ${option`value="Linux" innerText="Linux"`}
                                ${h2`innerText="Description"`}
                                ${textarea`class="${css.input}"`.bind(
                                    st,
                                    "description"
                                )}
                                ${h2`innerText="Variables"`}
                                ${div`class="${css.input}"`}
                                ${h2`innerText="Install"`}
                                ${textarea`class="${css.input}"`.bind(
                                    st,
                                    "install"
                                )}
                                ${h2`innerText="Start"`}
                                ${textarea`class="${css.input}"`.bind(
                                    st,
                                    "start"
                                )}
                                ${h2`innerText="Status"`}
                                ${textarea`class="${css.input}"`.bind(
                                    st,
                                    "status"
                                )}
                                ${h2`innerText="Script"`}
                                ${textarea`class="${css.input}"`.bind(
                                    st,
                                    "script"
                                )}
                                ${div`class="${css.submit}" `}
                                    ${button`innerText="Save"`.on(
                                        "click",
                                        savePackage
                                    )}`;

        f(({ showNew }) => {
            cont.innerHTML = "";
            if (showNew) {
                cont.appendChild(newCont);
            } else {
                cont.appendChild(main);
            }
        });

        f(({ name, os }) => {
            console.log(name, os);
        });

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

function savePackage() {
    console.log("text");
}

let css = style`
    .pannel {
        width: 100%;
        height: 100%;
        background: #0f0d15;
    }
    .searchBar {
        display: flex;
        background: #2d2a38;
        height: 150px;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }
    .searchBar > input {
        width: 80%;
        height: 29px;
        border: none;
        border-radius: 5px;
        color: #000;
        padding-left: 10px;
    }
    .searchBar > div {
        width: 80%;
        margin-top: 10px;
        display: flex;
    }

    .new {
        background: #13111c;
        border: none;
        border-radius: 3px;
        padding: 5px 10px;
        color: #eee;
        font-weight: 500;
        width: 100px;
        height: 29px;
        cursor: pointer;
    }
    .inputGroup {
        color: aliceblue;
        font-family: sans-serif;
        overflow-y: auto;
        height: 100vh;
        padding: 20px;
    }
    .input {
        min-height: 22px;
        background: #353a5661;
        border: none;
        border-radius: 3px;
        color: #fff;
    }
    textarea.input {
        width: 100%;
        height: 300px
    }
    select.input {
        width: 300px;
    }
    input.input {
        width: 300px;
    }
    .submit {
        margin-bottom: 100px;
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
    }
    .submit > button {
        width: 100px;
        height: 31px;
        background: #d7d7d7;
        border: none;
        border-radius: 3px;
        font-weight: 600;
        cursor: pointer;
    }
`;
