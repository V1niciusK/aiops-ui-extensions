/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SkeletonText } from '@carbon/react';
import type { AssignmentRow } from '../types';
import { NETCOOL_SEVERITY_COLORS } from '../constants';

type Props = {
  assignments: AssignmentRow[];
  loading?: boolean;
  onOpen: (situationId: string) => void;
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const AssignmentsList: React.FC<Props> = ({ assignments, loading, onOpen }) => {
  const hasData = assignments.length > 0;

  return (
    <section className='noc-triage-dashboard__assignments' aria-label='My assigned situations'>
      <header>
        <p className='noc-triage-dashboard__section-title'>My assigned situations</p>
        <span>{hasData ? `${assignments.length} open` : 'None assigned'}</span>
      </header>
      <div role='table'>
        <div role='row' className='noc-triage-dashboard__assignments-header'>
          <span role='columnheader'>Summary</span>
          <span role='columnheader'>Service</span>
          <span role='columnheader'>Opened</span>
        </div>
        <div role='rowgroup'>
          {loading && !hasData ? (
            <div className='noc-triage-dashboard__assignments-row'>
              <SkeletonText width='90%' />
            </div>
          ) : (
            assignments.map((assignment) => (
              <button
                type='button'
                role='row'
                key={assignment.id}
                className='noc-triage-dashboard__assignments-row'
                onClick={() => onOpen(assignment.id)}>
                <span role='cell' className='noc-triage-dashboard__assignments-summary'>
                  <span
                    className='noc-triage-dashboard__severity-dot'
                    style={{ backgroundColor: NETCOOL_SEVERITY_COLORS[assignment.severity] }}
                  />
                  {assignment.summary}
                </span>
                <span role='cell'>{assignment.service || 'Unknown'}</span>
                <span role='cell'>{formatTime(assignment.createdTime)}</span>
              </button>
            ))
          )}
          {!loading && !hasData && (
            <div className='noc-triage-dashboard__assignments-row empty-row'>
              No assigned situations.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AssignmentsList;
