"use client";
import { Bar } from "react-chartjs-2";
import { Chart, BarElement, CategoryScale, LinearScale } from "chart.js";
Chart.register(BarElement, CategoryScale, LinearScale);

export default function ProgressChart({ data }: { data: any[] }) {
  const labels = data.map((d) => d.topic);
  const values = data.map((d) => (d.error_rate * 100).toFixed(0));

  return (
    <div className="max-w-xl">
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: "% ошибок",
              data: values,
            },
          ],
        }}
        options={{
          plugins: { legend: { display: false } },
          scales: {
            y: { suggestedMax: 100 },
          },
        }}
      />
    </div>
  );
}
