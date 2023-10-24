export class InputDialog {
    constructor() {
        this.dialog = document.createElement("div");
        this.dialog.className = "input-dialog";

        this.inputContainer = document.createElement("div");
        this.inputContainer.className = "input-container";

        this.prompt = document.createElement("div");
        this.prompt.className = "input-prompt";
        this.inputContainer.appendChild(this.prompt);

        this.input = document.createElement("input");
        this.input.type = "text";
        this.input.addEventListener("keydown", (e) => {
            if (e.key == "Enter") {
                this.handleOKClick();
            }
        });
        this.inputContainer.appendChild(this.input);

        this.buttons = document.createElement("div");
        this.buttons.className = "input-buttons";
        this.inputContainer.appendChild(this.buttons);

        this.okButton = document.createElement("button");
        this.okButton.textContent = "OK";
        this.okButton.addEventListener("click", () => this.handleOKClick());
        this.buttons.appendChild(this.okButton);

        this.cancelButton = document.createElement("button");
        this.cancelButton.textContent = "Cancel";
        this.cancelButton.addEventListener("click", () =>
            this.handleCancelClick()
        );
        this.buttons.appendChild(this.cancelButton);

        this.dialog.style.display = "none";
        this.dialog.appendChild(this.inputContainer);
        document.body.appendChild(this.dialog);
    }

    async promptUser(promptText, initialValue = "") {
        return new Promise((resolve, reject) => {
            this.resolveCallback = resolve;
            this.rejectCallback = reject;

            this.prompt.textContent = promptText;
            this.input.value = initialValue;

            this.showDialog();
        });
    }

    handleOKClick() {
        const userInput = this.input.value;
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
