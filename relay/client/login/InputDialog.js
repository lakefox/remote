import { div, button, input, style } from "../html.js";

export class InputDialog {
    constructor() {
        this.dialog = div`class="${css.inputdialog}" style="display: none;"`;
        this.container = div`class="${css.container}"`;
        this.inputContainer = div`class="${css.inputContainer}"`;
        this.buttonContainer = div``;
        this.inputs = [];
        this.prompt = div`class="${css.inputprompt}"`;
        this.container.appendChild(this.prompt);

        this.input = input`type="text"`;
        this.inputContainer.appendChild(this.input);

        this.buttons = div`class="${css.inputbuttons}"`;
        this.buttonContainer.appendChild(this.buttons);

        this.okButton = button`textContent="OK"`;
        this.okButton.addEventListener("click", () => this.handleOKClick());
        this.buttons.appendChild(this.okButton);

        this.cancelButton = button`textContent="Cancel"`;
        this.cancelButton.addEventListener("click", () =>
            this.handleCancelClick()
        );
        this.buttons.appendChild(this.cancelButton);

        this.container.appendChild(this.inputContainer);
        this.container.appendChild(this.buttonContainer);
        this.dialog.appendChild(this.container);
        document.body.appendChild(this.dialog);
    }

    async promptUser(promptText, inputDescriptions = []) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.resolveCallback = resolve;
            self.rejectCallback = reject;
            self.inputs = [];
            self.prompt.textContent = promptText;
            self.inputContainer.innerHTML = "";

            // Create input fields based on the inputDescriptions array
            inputDescriptions.map((inputDesc) => {
                const inputElement = input`type="${inputDesc.type || "text"}"`;
                inputElement.placeholder = inputDesc.placeholder || "";
                inputElement.addEventListener("keydown", (e) => {
                    if (e.key == "Enter") {
                        self.handleOKClick();
                    }
                });
                self.inputs.push(inputElement);
                self.inputContainer.appendChild(inputElement);
                return inputElement;
            });

            self.showDialog();
        });
    }

    handleOKClick() {
        const userInput = this.inputs.map((e) => e.value);
        this.hideDialog();
        this.resolveCallback(userInput);
    }

    handleCancelClick() {
        this.hideDialog();
        this.rejectCallback("Canceled");
    }

    showDialog() {
        this.dialog.style.display = "flex";
        this.input.focus();
    }

    hideDialog() {
        this.dialog.style.display = "none";
    }
}

let css = style`
.inputdialog {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    flex-direction: row;
    flex-wrap: wrap;
    align-content: center;
}

.inputprompt {
    font-size: 18px;
    margin-bottom: 10px;
    color: #c5c5c5;
    font-family: sans-serif;
    width: 350px;
}

.inputdialog input {
    width: 350px;
    padding: 8px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-bottom: 10px;
}
a .inputbuttons {
    text-align: right;
}

.inputdialog button {
    padding: 8px 16px;
    margin: 5px;
    font-size: 16px;
    cursor: pointer;
    background: #08070b;
    border: none;
    color: #fff;
    border-radius: 3px;
}

.inputdialog button:hover {
    background-color: #007bff;
    color: #fff;
}

.inputdialog button:active {
    background-color: #0056b3;
}

.inputdialog button:focus {
    outline: none;
}

.container {
    background: #13111c;
    width: 500px;
    height: 300px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 7px;
    box-shadow: 0.0145rem 0.029rem 0.174rem rgba(0, 0, 0, 0.01698),
        0.0335rem 0.067rem 0.402rem rgba(0, 0, 0, 0.024),
        0.0625rem 0.125rem 0.75rem rgba(0, 0, 0, 0.03),
        0.1125rem 0.225rem 1.35rem rgba(0, 0, 0, 0.036),
        0.2085rem 0.417rem 2.502rem rgba(0, 0, 0, 0.04302),
        0.5rem 1rem 6rem rgba(0, 0, 0, 0.06),
        0 0 0 0.0625rem rgba(0, 0, 0, 0.015);
}
.inputContainer {
    display: flex;
    flex-direction: column;
}
`;
