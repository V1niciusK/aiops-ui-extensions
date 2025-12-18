/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo } from 'react';
import { useQuery } from '#src/helpers/useQuery';
import {
  AssignmentRow,
  NocTriageDerivedData,
  Situation,
  SituationsQueryResponse,
  SeverityBucket,
  SeverityLevel,
  ServiceImpactRow,
  TrendPoint
} from './types';
import { NETCOOL_SEVERITY_COLORS, SEVERITY_ORDER } from './constants';

const SITUATIONS_QUERY = 'getSituations'; // TODO: align with real query/method name once backend wiring is finalized.

const DEFAULT_COLUMNS = [
  'id',
  'severity',
  'status',
  'createdTime',
  'assignedTo',
  'service',
  'summary'
];

const severityPriority = (severity: SeverityLevel) => SEVERITY_ORDER.indexOf(severity);

const resolveTenantId = (tenantId?: string): string | undefined => {
  if (tenantId) return tenantId;
  // TODO: confirm the correct tenant path in akoraConfig when wiring to the platform runtime.
  return (window as any)?.akoraConfig?.baseState?.tenantId;
};

const resolveOperatorId = (operatorId?: string): string | undefined => {
  if (operatorId) return operatorId;
  const akoraBaseState = (window as any)?.akoraConfig?.baseState;
  return akoraBaseState?.user?.id || akoraBaseState?.user?.email || akoraBaseState?.user?.name;
};

const coerceSeverity = (value?: string): SeverityLevel | undefined => {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized.includes('critical')) return 'Critical';
  if (normalized.includes('major')) return 'Major';
  if (normalized.includes('minor')) return 'Minor';
  if (normalized.includes('warn')) return 'Warning';
  return undefined;
};

const parseSituations = (payload?: SituationsQueryResponse): Situation[] => {
  const maybeList = payload?.situations || payload?.tenant?.situations || [];
  if (!Array.isArray(maybeList)) return [];
  return maybeList
    .map((item) => {
      const severity = coerceSeverity(item.severity);
      if (!severity) return null;
      return { ...item, severity };
    })
    .filter((item): item is Situation => Boolean(item?.id));
};

const computeBuckets = (situations: Situation[]): SeverityBucket[] => {
  const counts: Record<SeverityLevel, number> = {
    Critical: 0,
    Major: 0,
    Minor: 0,
    Warning: 0
  };
  situations.forEach((situation) => {
    counts[situation.severity] += 1;
  });
  return SEVERITY_ORDER.map((severity) => ({
    severity,
    count: counts[severity],
    color: NETCOOL_SEVERITY_COLORS[severity]
  }));
};

const bucketizeTrend = (situations: Situation[], windowMinutes: number): TrendPoint[] => {
  const now = Date.now();
  const bucketSizeMinutes = windowMinutes <= 30 ? 3 : 5;
  const bucketSizeMs = bucketSizeMinutes * 60 * 1000;
  const bucketCount = Math.ceil(windowMinutes / bucketSizeMinutes);
  const start = now - windowMinutes * 60 * 1000;

  return Array.from({ length: bucketCount }).map((_, index) => {
    const bucketStart = start + index * bucketSizeMs;
    const bucketEnd = bucketStart + bucketSizeMs;
    const value = situations.reduce((acc, situation) => {
      const created = new Date(situation.createdTime).getTime();
      if (created >= bucketStart && created < bucketEnd) {
        return acc + 1;
      }
      return acc;
    }, 0);
    return {
      timestamp: new Date(bucketEnd).toISOString(),
      value
    };
  });
};

const computeServiceImpacts = (situations: Situation[], limit: number): ServiceImpactRow[] => {
  const aggregates = new Map<string, { count: number; dominantSeverity: SeverityLevel }>();
  situations.forEach((situation) => {
    const key = situation.service?.trim() || 'Unassigned service';
    if (!aggregates.has(key)) {
      aggregates.set(key, { count: 0, dominantSeverity: situation.severity });
    }
    const entry = aggregates.get(key)!;
    entry.count += 1;
    if (severityPriority(situation.severity) < severityPriority(entry.dominantSeverity)) {
      entry.dominantSeverity = situation.severity;
    }
  });

  return Array.from(aggregates.entries())
    .map<ServiceImpactRow>(([serviceName, details]) => ({
      serviceName,
      count: details.count,
      dominantSeverity: details.dominantSeverity
    }))
    .sort((a, b) => {
      if (a.dominantSeverity === b.dominantSeverity) {
        return b.count - a.count;
      }
      return severityPriority(a.dominantSeverity) - severityPriority(b.dominantSeverity);
    })
    .slice(0, limit);
};

const findOldestUnack = (situations: Situation[]): { item?: Situation; ageMinutes?: number } => {
  const unacknowledged = situations
    .filter((situation) => !isAcknowledged(situation.status))
    .sort((a, b) => new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime());
  if (!unacknowledged.length) return {};
  const oldest = unacknowledged[0];
  const ageMinutes = Math.floor((Date.now() - new Date(oldest.createdTime).getTime()) / (60 * 1000));
  return {
    item: oldest,
    ageMinutes
  };
};

const computeAssignments = (
  situations: Situation[],
  operatorId: string | undefined,
  limit: number
): AssignmentRow[] => {
  if (!operatorId) return [];
  return situations
    .filter((situation) => situation.assignedTo?.toLowerCase() === operatorId.toLowerCase())
    .sort((a, b) => {
      const severityDiff = severityPriority(a.severity) - severityPriority(b.severity);
      if (severityDiff !== 0) return severityDiff;
      return new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime();
    })
    .slice(0, limit)
    .map(({ id, summary, severity, createdTime, status, service }) => ({
      id,
      summary,
      severity,
      createdTime,
      status,
      service
    }));
};

const isAcknowledged = (status?: string): boolean => {
  if (!status) return false;
  const normalized = status.toLowerCase();
  return normalized.includes('ack');
};

const computeTrendSummary = (situations: Situation[]): {
  last15: number;
  lastHour: number;
  deltaVsPrev15: number;
} => {
  const now = Date.now();
  const minutesAgo = (minutes: number) => now - minutes * 60 * 1000;
  const last15Window = minutesAgo(15);
  const lastHourWindow = minutesAgo(60);
  const prev15Window = minutesAgo(30);

  let last15 = 0;
  let lastHour = 0;
  let prev15 = 0;
  situations.forEach((situation) => {
    const created = new Date(situation.createdTime).getTime();
    if (created >= lastHourWindow) {
      lastHour += 1;
    }
    if (created >= last15Window) {
      last15 += 1;
    } else if (created >= prev15Window) {
      prev15 += 1;
    }
  });

  return {
    last15,
    lastHour,
    deltaVsPrev15: last15 - prev15
  };
};

export interface UseNocTriageDataOptions {
  tenantId?: string;
  operatorId?: string;
  topServicesLimit?: number;
  assignmentsLimit?: number;
  trendWindowMinutes?: number;
  pollIntervalMs?: number;
}

export const useNocTriageData = ({
  tenantId,
  operatorId,
  topServicesLimit = 5,
  assignmentsLimit = 6,
  trendWindowMinutes = 60,
  pollIntervalMs
}: UseNocTriageDataOptions) => {
  const resolvedTenantId = resolveTenantId(tenantId);
  const resolvedOperatorId = resolveOperatorId(operatorId);

  const queryOptions = useMemo(() => {
    if (!resolvedTenantId) return {};
    return {
      tenantId: resolvedTenantId,
      columns: DEFAULT_COLUMNS,
      filter: 'status != "closed"', // TODO: revisit filter clause when backend contract is confirmed.
      limit: 500
    };
  }, [resolvedTenantId]);

  const queryName = resolvedTenantId ? SITUATIONS_QUERY : '';
  const { data, error, loading, refetch } = useQuery<SituationsQueryResponse>(queryName, queryOptions);

  const situations = useMemo(() => parseSituations(data), [data]);

  const severityBuckets = useMemo(() => computeBuckets(situations), [situations]);
  const trendPoints = useMemo(
    () => bucketizeTrend(situations, trendWindowMinutes),
    [situations, trendWindowMinutes]
  );
  const trendSummary = useMemo(() => computeTrendSummary(situations), [situations]);
  const serviceImpacts = useMemo(
    () => computeServiceImpacts(situations, topServicesLimit),
    [situations, topServicesLimit]
  );
  const { item: oldestUnacknowledged, ageMinutes: oldestUnacknowledgedMinutes } = useMemo(
    () => findOldestUnack(situations),
    [situations]
  );
  const myAssignments = useMemo(
    () => computeAssignments(situations, resolvedOperatorId, assignmentsLimit),
    [situations, resolvedOperatorId, assignmentsLimit]
  );

  const totalActive = severityBuckets.reduce((acc, bucket) => acc + bucket.count, 0);

  useEffect(() => {
    if (!pollIntervalMs || !resolvedTenantId) return undefined;
    const handle = window.setInterval(() => refetch(), pollIntervalMs);
    return () => window.clearInterval(handle);
  }, [pollIntervalMs, refetch, resolvedTenantId]);

  const derived: NocTriageDerivedData = {
    severityBuckets,
    totalActive,
    trendPoints,
    trendSummary: {
      last15Minutes: trendSummary.last15,
      lastHour: trendSummary.lastHour,
      deltaVsPrev15: trendSummary.deltaVsPrev15
    },
    serviceImpacts,
    oldestUnacknowledged,
    oldestUnacknowledgedMinutes,
    myAssignments
  };

  return {
    data: derived,
    loading,
    error,
    refetch
  };
};
