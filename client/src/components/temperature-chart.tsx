import { Card } from "@/components/ui/card";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import type { SensorData } from "@shared/schema";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TemperatureChartProps {
  sensorData: SensorData[];
}

export default function TemperatureChart({ sensorData }: TemperatureChartProps) {
  // Filter temperature data and get last 24 points
  const temperatureData = sensorData
    .filter(data => data.sensorType === "temperature")
    .slice(0, 24)
    .reverse();

  const labels = temperatureData.map((_, index) => {
    const hoursAgo = temperatureData.length - 1 - index;
    const time = new Date(Date.now() - hoursAgo * 60 * 1000); // 1 minute intervals for demo
    return time.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  });

  const values = temperatureData.map(data => data.value);
  const threshold = temperatureData[0]?.threshold || 580;

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Core Temperature (°C)',
        data: values,
        borderColor: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#FF9800',
        pointBorderColor: '#FF9800',
        pointRadius: 3,
      },
      {
        label: 'Normal Range',
        data: new Array(labels.length).fill(threshold),
        borderColor: '#4CAF50',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#B0BEC5',
        },
      },
      tooltip: {
        backgroundColor: '#2D2D2D',
        titleColor: '#FFFFFF',
        bodyColor: '#B0BEC5',
        borderColor: '#444444',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#B0BEC5',
          maxTicksLimit: 8,
        },
        grid: {
          color: '#2D2D2D',
        },
      },
      y: {
        ticks: {
          color: '#B0BEC5',
        },
        grid: {
          color: '#2D2D2D',
        },
        min: Math.min(...values) - 10,
        max: Math.max(...values) + 10,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <Card className="bg-dark-surface border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4">Core Temperature Trend</h3>
      <div className="h-64">
        {temperatureData.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <i className="fas fa-chart-line text-4xl mb-2"></i>
              <p>Waiting for temperature data...</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
