import { div, style } from "./html.js";

let { container } = style`
    #container {
        font-weight: 600;
    }
`;

class DeviceTable {
    constructor() {
        let cont = div`class="${container}" style="width:100%;"`;
    }
}
