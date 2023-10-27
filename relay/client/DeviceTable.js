import { select, option, style } from "./html.js";

let { container } = style`
    .dropdown {
        
    }
`;

export class DeviceTable {
    constructor(devices) {
        let dropdown = select`class="${container}"`;

        for (let i = 0; i < devices.length; i++) {
            dropdown.appendChild(
                option`value="${devices[i]}" innerHTML="${devices[i]}"`
            );
        }

        return dropdown;
    }
}
