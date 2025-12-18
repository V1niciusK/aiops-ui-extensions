/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

export type SeverityLevel = 'Critical' | 'Major' | 'Minor' | 'Warning';

export interface Situation {
  id: string;
  severity: SeverityLevel;
  status: string;
  createdTime: string;
  summary: string;
  assignedTo?: string;
  service?: string;
}

export interface SituationsQueryResponse {
  situations?: Situation[];
  tenant?: {
    situations?: Situation[];
  };
}

export interface SeverityBucket {
  severity: SeverityLevel;
  count: number;
  color: string;
}

export interface TrendPoint {
  timestamp: string;
  value: number;
}

export interface ServiceImpactRow {
  serviceName: string;
  count: number;
  dominantSeverity: SeverityLevel;
}

export interface AssignmentRow {
  id: string;
  summary: string;
  severity: SeverityLevel;
  createdTime: string;
  status: string;
  service?: string;
}

export interface TrendSummary {
  last15Minutes: number;
  lastHour: number;
  deltaVsPrev15: number;
}

export interface NocTriageDerivedData {
  severityBuckets: SeverityBucket[];
  totalActive: number;
  trendPoints: TrendPoint[];
  trendSummary: TrendSummary;
  serviceImpacts: ServiceImpactRow[];
  oldestUnacknowledged?: Situation;
  oldestUnacknowledgedMinutes?: number;
  myAssignments: AssignmentRow[];
}

export interface NocTriageDashboardProps {
  tenantId?: string;
  operatorId?: string;
  topServicesLimit?: number;
  assignmentsLimit?: number;
  trendWindowMinutes?: number;
  pollIntervalMs?: number;
  onOpenSituation?: (situationId: string) => void;
}
