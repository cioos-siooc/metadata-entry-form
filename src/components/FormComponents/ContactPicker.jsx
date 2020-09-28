import React from "react";
import SelectInput from "./SelectInput";

const ContactPicker = ({ contactList, value, name, onChange }) => {
    const _contactList = Object.values(contactList || {});

    return (
        <SelectInput
            value={value}
            onChange={(e) => {
                onChange({
                    target: { name, value: e.target.value },
                });
            }}
            optionLabels={_contactList.map(
                (contact) => `${contact.indName} ${contact.orgName}`
            )}
            options={_contactList.map((v, i) => i)}
            disabled={!_contactList.length}
        />
    );
};

export default ContactPicker;
