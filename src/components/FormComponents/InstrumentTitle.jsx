import React from "react";

import { I18n } from "../I18n";

/* Functions used to format text in the instrument page, left column */
// creates text from an instrument in the form
// <instrumentName> - <instrumentType>
function getInstrumentTitleFromNames(instrument) {
    const { id, manufacturer } = instrument;
    const titleParts = [manufacturer, id];

    return titleParts
        .filter((e) => e)
        .map((e) => e.trim())
        .filter((e) => e)
        .join(" - ");
}

function InstrumentTitle({instrument}) {
    return (
        getInstrumentTitleFromNames(instrument) ||
        (<I18n en="New instrument" fr="Nouvel instrument" />)
    );
}

export default InstrumentTitle;
