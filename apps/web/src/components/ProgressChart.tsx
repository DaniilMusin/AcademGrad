"use client";
import { memo, useMemo } from "react";

interface ProgressChartProps {
  data: number[];
}

// Простой график без тяжелых библиотек для dashboard
const ProgressChart = memo(({ data }: ProgressChartProps) => {
  const maxValue = useMemo(() => Math.max(...data, 1), [data]);
  
  const chartData = useMemo(() => {
    return data.map((value, index) => ({
      day: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][index],
      value,
      height: (value / maxValue) * 100
    }));
  }, [data, maxValue]);

  return (
    <div className="w-full h-64">
      <div className="flex items-end justify-center h-full space-x-2 p-4">
        {chartData.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className="bg-blue-500 rounded-t min-h-1 w-full transition-all duration-500"
              style={{ height: `${item.height}%` }}
              title={`${item.day}: ${item.value} задач`}
            ></div>
            <span className="text-xs text-gray-600 mt-2">{item.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

ProgressChart.displayName = 'ProgressChart';

export default ProgressChart;
