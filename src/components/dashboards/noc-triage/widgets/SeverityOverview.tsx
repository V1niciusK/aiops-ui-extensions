/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SkeletonText } from '@carbon/react';
import type { SeverityBucket } from '../types';

type Props = {
  buckets: SeverityBucket[];
  total: number;
  loading?: boolean;
};

const SeverityOverview: React.FC<Props> = ({ buckets, total, loading }) => {
  return (
    <section className='noc-triage-dashboard__severity' aria-label='Active situations by severity'>
      {buckets.map(({ severity, count, color }) => {
        const share = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div
            key={severity}
            className='noc-triage-dashboard__severity-bucket'
            style={{ borderColor: color }}
            aria-label={`${severity} situations`}>
            <div className='noc-triage-dashboard__severity-label'>
              <span className='noc-triage-dashboard__severity-dot' style={{ backgroundColor: color }} />
              {severity}
            </div>
            <div className='noc-triage-dashboard__severity-value'>
              {loading ? <SkeletonText width='2rem' /> : count}
              <span className='noc-triage-dashboard__severity-share'>{share}%</span>
            </div>
            <div className='noc-triage-dashboard__severity-bar'>
              <div
                className='noc-triage-dashboard__severity-bar-fill'
                style={{ width: `${share}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default SeverityOverview;
