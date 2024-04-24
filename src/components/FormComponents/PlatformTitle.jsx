import React from "react";

import { I18n } from "../I18n";

/* Functions used to format text in the platform page, left column */

// creates text from an platform in the form
// <platformName> - <platformType>
function getPlatformTitleFromNames(platform) {
    const { id, type } = platform;
    const titleParts = [type, id];

    return titleParts
        .filter((e) => e)
        .map((e) => e.trim())
        .filter((e) => e)
        .join(" - ");
}

function PlatformTitle({platform} ) {
    return (
        getPlatformTitleFromNames(platform) ||
        (<I18n en="New platform" fr="Nouvel platform" />)
    );
}

export default PlatformTitle;
