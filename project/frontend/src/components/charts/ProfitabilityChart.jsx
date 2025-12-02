import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ProfitabilityChart = ({ data, title }) => {
  return (
    <div className="chart-container">
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="profitability" fill="#8884d8" name="Рентабельность (%)" />
          <Bar dataKey="revenue" fill="#82ca9d" name="Выручка ($)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProfitabilityChart;