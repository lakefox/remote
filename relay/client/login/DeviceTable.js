import { select, option, style } from "../html.js";

export class DeviceTable {
    constructor(devices) {
        let dropDown = select`class="${dropdown}"`;

        for (let i = 0; i < devices.length; i++) {
            dropDown.appendChild(
                option`value="${devices[i]}" innerHTML="${devices[i]}"`
            );
        }

        return dropdown;
    }
}
let { dropdown } = style`
    .dropdown {
        
    }
`;
