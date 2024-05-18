import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faEdit } from "@fortawesome/free-regular-svg-icons";

export function Tracker() {
  return (
    <div className="border rounded p-2">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row gap-2">
          <p>Logo</p>
          <h3 className="text-lg font-bold">Tracker Title</h3>
        </div>
        <div className="flex flex-row gap-2">
          <FontAwesomeIcon size="2x" icon={faHeart} />
          <FontAwesomeIcon size="2x" icon={faEdit} />
        </div>
      </div>
      <div className="flex flex-row justify-between">
        <div>Web preview</div>
        <div>Chart</div>
      </div>
    </div>
  );
}
