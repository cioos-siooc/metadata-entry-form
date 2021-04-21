import { useParams } from "react-router-dom";

import regions from "../../regions";

// The catalogue title is, eg CIOOS Pacific data catalogue
function GetRegionInfo() {
  const { region } = useParams();
  return regions[region];
}

export default GetRegionInfo;
