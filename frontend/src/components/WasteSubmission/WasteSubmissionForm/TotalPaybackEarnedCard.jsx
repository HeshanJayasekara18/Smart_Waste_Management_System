import { FiDollarSign } from "react-icons/fi";

const TotalPaybackEarnedCard = ({ amount = 0 }) => {
  return (
    <div className="bg-blue-100 rounded-xl shadow-md px-4 py-8 flex items-center justify-between w-full sm:w-1/2">
      <div className="flex items-center">
        <FiDollarSign className="text-blue-600 text-3xl mr-3" />
        <div>
          <h4 className="text-sm text-gray-600 font-medium">Total Payback Earned</h4>
          <p className="text-2xl font-bold text-gray-900">Rs. {amount.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default TotalPaybackEarnedCard;
