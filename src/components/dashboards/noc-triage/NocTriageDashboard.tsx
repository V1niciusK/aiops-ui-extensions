/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { Button, InlineLoading, InlineNotification } from '@carbon/react';
// @ts-ignore
import getReactRenderer from '@ibm/akora-renderer-react';

import SeverityOverview from './widgets/SeverityOverview';
import TrendPanel from './widgets/TrendPanel';
import ServiceImpactList from './widgets/ServiceImpactList';
import OldestSituationCard from './widgets/OldestSituationCard';
import AssignmentsList from './widgets/AssignmentsList';
import { useNocTriageData } from './useNocTriageData';
import type { NocTriageDashboardProps } from './types';

import './noc-triage-dashboard.scss';

const ReactRenderer = getReactRenderer(React, ReactDOM);
const { useAkoraState, setUrlParameters } = ReactRenderer.components;

const className = 'noc-triage-dashboard';

const NocTriageDashboard: React.FC<NocTriageDashboardProps> = (props) => {
  const { onOpenSituation } = props;
  const { state, app } = useAkoraState();
  const { data, loading, error, refetch } = useNocTriageData(props);

  const handleSituationOpen = useCallback((id: string) => {
    if (onOpenSituation) {
      onOpenSituation(id);
      return;
    }
    if (!state || !app) return;
    const targetUrl = state?.resolvedFullPath || state?.fullPath;
    if (!targetUrl) return;
    const routeWithSituation = setUrlParameters(targetUrl, { situationId: id });
    app.replaceRoute(routeWithSituation);
  }, [app, onOpenSituation, setUrlParameters, state]);

  return (
    <div className={className} role='main'>
      <header className={`${className}__header`}>
        <div>
          <p>Active situations</p>
          <h2>{loading && !data ? <InlineLoading /> : data?.totalActive ?? 0}</h2>
        </div>
        <Button kind='ghost' size='sm' onClick={() => refetch()} disabled={loading}>
          Refresh
        </Button>
      </header>

      {error && (
        <InlineNotification
          lowContrast
          kind='error'
          title='Failed to load situations'
          subtitle='The data service responded with an error. Retry shortly.'
        />
      )}

      <div className={`${className}__grid`}>
        <div className={`${className}__grid-item severity`}>
          <SeverityOverview buckets={data?.severityBuckets || []} total={data?.totalActive ?? 0} loading={loading} />
        </div>
        <div className={`${className}__grid-item trend`}>
          {data && <TrendPanel points={data.trendPoints} summary={data.trendSummary} loading={loading} />}
        </div>
        <div className={`${className}__grid-item services`}>
          <ServiceImpactList services={data?.serviceImpacts || []} loading={loading} />
        </div>
        <div className={`${className}__grid-item oldest`}>
          <OldestSituationCard
            situation={data?.oldestUnacknowledged}
            ageMinutes={data?.oldestUnacknowledgedMinutes}
            loading={loading}
            onOpen={handleSituationOpen}
          />
        </div>
        <div className={`${className}__grid-item assignments`}>
          <AssignmentsList assignments={data?.myAssignments || []} loading={loading} onOpen={handleSituationOpen} />
        </div>
      </div>
    </div>
  );
};

export default NocTriageDashboard;
