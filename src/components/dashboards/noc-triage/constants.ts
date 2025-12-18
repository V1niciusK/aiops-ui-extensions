/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SeverityLevel } from './types';

export const SEVERITY_ORDER: SeverityLevel[] = ['Critical', 'Major', 'Minor', 'Warning'];

export const NETCOOL_SEVERITY_COLORS: Record<SeverityLevel, string> = {
  Critical: '#da1e28',
  Major: '#ff832b',
  Minor: '#f1c21b',
  Warning: '#0f62fe'
};

export const DEFAULT_TREND_WINDOW_MINUTES = 60;
