import React from "react";
import NavDrawer from "./NavDrawer";
import MetadataForm from "./MetadataForm";

export default function Layout() {
  return (
    <NavDrawer>
      <MetadataForm />
    </NavDrawer>
  );
}
