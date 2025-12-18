/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SkeletonText, Tag } from '@carbon/react';
import type { ServiceImpactRow } from '../types';
import { NETCOOL_SEVERITY_COLORS } from '../constants';

type Props = {
  services: ServiceImpactRow[];
  loading?: boolean;
  onServiceClick?: (serviceName: string) => void;
};

const ServiceImpactList: React.FC<Props> = ({ services, loading, onServiceClick }) => {
  const hasData = services.length > 0;
  return (
    <section className='noc-triage-dashboard__services' aria-label='Top impacted services'>
      <header>
        <p className='noc-triage-dashboard__section-title'>Top impacted services</p>
        <span>{!loading && hasData ? `${services.length} services` : null}</span>
      </header>
      <div role='table'>
        <div role='row' className='noc-triage-dashboard__services-header'>
          <span role='columnheader'>Service</span>
          <span role='columnheader'>Active situations</span>
        </div>
        <div role='rowgroup'>
          {loading && !hasData ? (
            <div className='noc-triage-dashboard__services-row'>
              <SkeletonText width='90%' />
            </div>
          ) : (
            services.map(({ serviceName, count, dominantSeverity }) => {
              const clickHandler = onServiceClick ? () => onServiceClick(serviceName) : undefined;
              return (
                <button
                  type='button'
                  key={serviceName}
                  role='row'
                  className='noc-triage-dashboard__services-row'
                  onClick={clickHandler}
                  disabled={!clickHandler}>
                  <span role='cell' className='noc-triage-dashboard__services-name'>
                    <Tag
                      size='sm'
                      type='gray'
                      style={{ borderColor: NETCOOL_SEVERITY_COLORS[dominantSeverity], color: NETCOOL_SEVERITY_COLORS[dominantSeverity] }}>
                      {dominantSeverity}
                    </Tag>
                    {serviceName}
                  </span>
                  <span role='cell' className='noc-triage-dashboard__services-count'>{count}</span>
                </button>
              );
            })
          )}
          {!loading && !hasData && (
            <div className='noc-triage-dashboard__services-row empty-row'>
              No active service impact detected.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ServiceImpactList;
