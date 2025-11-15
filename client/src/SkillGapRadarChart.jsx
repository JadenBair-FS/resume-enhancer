import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

// Register the components Chart.js needs for a Radar chart
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const SkillGapRadarChart = ({ labels, jobScores, resumeScores }) => {
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Job Requirement (AI Score)',
        data: jobScores,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
      },
      {
        label: 'Your Resume (Skill Found)',
        data: resumeScores,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Skill Gap Analysis',
        font: {
          size: 18,
          weight: 'bold',
        },
        padding: {
          bottom: 20,
        },
      },
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.r !== null) {
              const score = context.dataset.data[context.dataIndex];
              label += (score * 100).toFixed(0) + '%';
            }
            return label;
          },
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 1.0,
        ticks: {
          callback: function (value) {
            return (value * 100).toFixed(0) + '%';
          },
          backdropColor: 'rgba(0, 0, 0, 0)', 
          color: '#666',
        },
        pointLabels: {
          font: {
            size: 14,
          },
        },
      },
    },
  };

  return <Radar data={chartData} options={chartOptions} />;
};

export default SkillGapRadarChart;