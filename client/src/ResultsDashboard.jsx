import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register the components Chart.js needs
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ResultsDashboard = ({ skillData, downloadPath, onReset }) => {
  // Prepare data for the bar chart
  const labels = skillData.map((s) => s.skill);
  const scores = skillData.map((s) => s.score);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Skill Relevance Score',
        data: scores,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y', // Horizontal bars
    elements: {
      bar: {
        borderWidth: 2,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Top 5 Recommended Skills',
        font: {
          size: 18,
          weight: 'bold',
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.x !== null) {
              // Format score to a percentage
              label += (context.parsed.x * 100).toFixed(0) + '% Match';
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 1.0, // Cosine similarity is between 0 and 1
        ticks: {
          // Format x-axis ticks as percentages
          callback: function (value) {
            return (value * 100).toFixed(0) + '%';
          },
        },
      },
    },
  };

  return (
    <div className="result-container">
      <h2>Enhancement Complete!</h2>
      <p>
        We analyzed the job and recommend these skills. The chart shows how
        relevant our AI found each skill to be.
      </p>
      
      <div style={{ height: '300px', width: '100%', margin: '30px 0' }}>
        <Bar options={chartOptions} data={chartData} />
      </div>

      <a href={downloadPath} className="btn-primary" download>
        Download Updated Resume
      </a>
      <button onClick={onReset} className="btn-secondary">
        Enhance Another
      </button>
    </div>
  );
};

export default ResultsDashboard;