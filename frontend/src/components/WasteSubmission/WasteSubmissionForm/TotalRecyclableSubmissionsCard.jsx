import { FaRecycle } from "react-icons/fa";

const TotalRecyclableSubmissionsCard = ({ count = 0 }) => {
  return (
    <div className="bg-blue-100 rounded-xl shadow-md px-4 py-8 flex items-center justify-between w-full sm:w-1/2">
      <div className="flex items-center">
        <FaRecycle className="text-blue-600 text-3xl mr-3" />
        <div>
          <h4 className="text-sm text-gray-600 font-medium">Total Recyclable Submissions</h4>
          <p className="text-2xl font-bold text-gray-900">{count}</p>
        </div>
      </div>
    </div>
  );
};

export default TotalRecyclableSubmissionsCard;
