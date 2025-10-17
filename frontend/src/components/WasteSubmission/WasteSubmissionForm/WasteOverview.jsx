import React, { useEffect, useState } from "react";
import TotalRecyclableSubmissionsCard from "./TotalRecyclableSubmissionsCard";
import TotalPaybackEarnedCard from "./TotalPaybackEarnedCard";
import WasteSubmissionService from "../../../services/WasteSubmissionService";

export default function WasteOverview() {
  const [recyclableCount, setRecyclableCount] = useState(0);
  const [totalPayback, setTotalPayback] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { recyclableCount, totalPayback } = await WasteSubmissionService.getStats();
        setRecyclableCount(recyclableCount);
        setTotalPayback(totalPayback);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-6">
      <TotalRecyclableSubmissionsCard count={recyclableCount} />
      <TotalPaybackEarnedCard amount={totalPayback} />
    </div>
  );
}
