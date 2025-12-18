/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { LineChart, type ChartTabularData, type LineChartOptions } from '@carbon/charts-react';
import '@carbon/charts-react/styles.css';
import type { TrendPoint, TrendSummary } from '../types';

type Props = {
  points: TrendPoint[];
  summary: TrendSummary;
  loading?: boolean;
};

const TrendPanel: React.FC<Props> = ({ points, summary, loading }) => {
  const chartData: ChartTabularData = useMemo(() => points.map((point) => ({
    group: 'Active situations',
    date: new Date(point.timestamp),
    value: point.value
  })), [points]);

  const options: LineChartOptions = useMemo(() => ({
    axes: {
      bottom: {
        mapsTo: 'date',
        scaleType: 'time'
      },
      left: {
        mapsTo: 'value',
        scaleType: 'linear'
      }
    },
    curve: 'curveMonotoneX',
    data: {
      loading
    },
    height: '180px',
    legend: {
      enabled: false
    },
    points: {
      enabled: false
    },
    toolbar: {
      enabled: false
    }
  }), [loading]);

  const deltaClass = summary.deltaVsPrev15 >= 0 ? 'positive' : 'negative';
  const deltaLabel = summary.deltaVsPrev15 >= 0 ? '↑' : '↓';

  return (
    <section className='noc-triage-dashboard__trend' aria-label='Situation trend'>
      <header className='noc-triage-dashboard__trend-header'>
        <div>
          <p className='noc-triage-dashboard__trend-title'>Trend</p>
          <p className='noc-triage-dashboard__trend-subtitle'>Last 60 min</p>
        </div>
        <div className='noc-triage-dashboard__trend-stats'>
          <div>
            <p className='noc-triage-dashboard__trend-metric'>{summary.last15Minutes}</p>
            <span>in last 15 min</span>
          </div>
          <div>
            <p className='noc-triage-dashboard__trend-metric'>{summary.lastHour}</p>
            <span>in last hour</span>
          </div>
          <div className={`noc-triage-dashboard__trend-delta ${deltaClass}`}>
            <p>{deltaLabel} {Math.abs(summary.deltaVsPrev15)}</p>
            <span>vs previous 15 min</span>
          </div>
        </div>
      </header>
      <LineChart data={chartData} options={options} />
    </section>
  );
};

export default TrendPanel;
