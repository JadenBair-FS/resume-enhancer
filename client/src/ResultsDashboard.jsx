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

import SkillGapRadarChart from './SkillGapRadarChart.jsx';
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ResultsDashboard = ({ aiSkills, userSkills, downloadUrl, onReset }) => {
  
  const barLabels = aiSkills.map((s) => s.skill);
  const barScores = aiSkills.map((s) => s.score);

  const barChartData = {
    labels: barLabels,
    datasets: [
      {
        label: 'Skill Relevance Score',
        data: barScores,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    indexAxis: 'y', 
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      title: {
        display: true,
        text: 'AI Skill Relevance',
        font: { size: 18, weight: 'bold' },
        padding: { bottom: 20 },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.x !== null) {
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
        max: 1.0,
        ticks: {
          callback: function (value) {
            return (value * 100).toFixed(0) + '%';
          },
        },
      },
    },
  };

  const radarLabels = aiSkills.map((s) => s.skill);
  const radarJobScores = aiSkills.map((s) => s.score);

  const userSkillsSet = new Set(userSkills.map((s) => s.toLowerCase()));

  const radarResumeScores = aiSkills.map((aiSkill) => {
    const hasSkill = userSkillsSet.has(aiSkill.skill.toLowerCase());
    return hasSkill ? aiSkill.score : 0;
  });

  return (
    <div className="result-container">
      <h2>Enhancement Complete!</h2>
      <p>
        We analyzed the job, read your resume, and generated this skill-gap
        analysis.
      </p>
      <div style={{ height: '450px', width: '100%', margin: '30px 0' }}>
        <SkillGapRadarChart
          labels={radarLabels}
          jobScores={radarJobScores}
          resumeScores={radarResumeScores}
        />
      </div>
      <div style={{ height: '300px', width: '100%', margin: '50px 0' }}>
        <Bar options={barChartOptions} data={barChartData} />
      </div>
      <a
        href={downloadUrl}
        className="btn-primary"
        download="enhanced_resume.docx"
      >
        Download Updated Resume
      </a>
      <button onClick={onReset} className="btn-secondary">
        Enhance Another
      </button>
    </div>
  );
};

export default ResultsDashboard;