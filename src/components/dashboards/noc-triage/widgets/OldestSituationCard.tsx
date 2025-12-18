/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button, SkeletonText, Tag } from '@carbon/react';
import type { Situation } from '../types';
import { NETCOOL_SEVERITY_COLORS } from '../constants';

type Props = {
  situation?: Situation;
  ageMinutes?: number;
  loading?: boolean;
  onOpen?: (situationId: string) => void;
};

const formatDuration = (minutes?: number) => {
  if (minutes === undefined) return '';
  if (minutes < 1) return '< 1 min';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) {
    return `${minutes} min`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

const OldestSituationCard: React.FC<Props> = ({ situation, ageMinutes, loading, onOpen }) => {
  const hasData = Boolean(situation);
  const formattedAge = formatDuration(ageMinutes);

  return (
    <section className='noc-triage-dashboard__oldest'>
      <p className='noc-triage-dashboard__section-title'>Oldest unacknowledged</p>
      {loading && !hasData && <SkeletonText width='100%' />}
      {!loading && !hasData && <p className='noc-triage-dashboard__empty'>All situations are acknowledged.</p>}
      {hasData && situation && (
        <>
          <div className='noc-triage-dashboard__oldest-badge' style={{ borderColor: NETCOOL_SEVERITY_COLORS[situation.severity] }}>
            <span>{formattedAge}</span>
            <Tag size='sm' type='gray' style={{ color: NETCOOL_SEVERITY_COLORS[situation.severity], borderColor: NETCOOL_SEVERITY_COLORS[situation.severity] }}>
              {situation.severity}
            </Tag>
          </div>
          <p className='noc-triage-dashboard__oldest-summary'>{situation.summary}</p>
          <div className='noc-triage-dashboard__oldest-meta'>
            <span>Service: {situation.service || 'Unknown'}</span>
            <span>Status: {situation.status}</span>
          </div>
          <Button kind='danger' size='sm' onClick={() => onOpen?.(situation.id)}>
            Open in situation details
          </Button>
        </>
      )}
    </section>
  );
};

export default OldestSituationCard;
