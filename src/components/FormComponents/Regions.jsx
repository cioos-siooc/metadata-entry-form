import { useParams } from "react-router-dom";

import regions from "../../regions";

function GetRegionInfo() {
  const { region } = useParams();
  return regions[region];
}

export default GetRegionInfo;
