/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

/**
 * Defines settings for the elasticsearch-js client used for the SO migrations
 */
export const MIGRATION_CLIENT_OPTIONS = { maxRetries: 0, requestTimeout: 310_000 };

/**
 * Types that are no longer registered and need to be removed
 * As of 8.8, no new types are allowed to be removed.
 * Removing saved object types is not backward compatible
 */
export const REMOVED_TYPES: string[] = [
  'apm-services-telemetry',
  'background-session',
  'cases-sub-case',
  'file-upload-telemetry',
  // https://github.com/elastic/kibana/issues/91869
  'fleet-agent-events',
  // https://github.com/elastic/obs-dc-team/issues/334
  'fleet-agents',
  'fleet-agent-actions',
  'fleet-enrollment-api-keys',
  // replaced by guided-onboarding-guide-state in 8.6
  'guided-setup-state',
  // Was removed in 7.12
  'ml-telemetry',
  'server',
  // https://github.com/elastic/kibana/issues/95617
  'tsvb-validation-telemetry',
  // replaced by osquery-manager-usage-metric
  'osquery-usage-metric',
  // Was removed in 8.1 https://github.com/elastic/kibana/issues/91265
  'siem-detection-engine-rule-status',
  // Was removed in 8.7 https://github.com/elastic/kibana/issues/130966
  'siem-detection-engine-rule-execution-info',
  // Was removed in 7.16
  'timelion-sheet',
  // Removed in 8.3 https://github.com/elastic/kibana/issues/127745
  'ui-counter',
  // Deprecated, no longer used since 7.13 https://github.com/elastic/kibana/pull/94923/files
  'application_usage_transactional',
  // Removed in 7.8.1 / 7.9.0 https://github.com/elastic/kibana/pull/69871
  'maps-telemetry',
  // Deprecated, no longer used since 8.7 https://github.com/elastic/kibana/pull/148530
  'csp_rule',
  // Removed in 8.8 https://github.com/elastic/kibana/pull/151116
  'upgrade-assistant-telemetry',
  // Removed in 8.8 https://github.com/elastic/kibana/pull/155204
  'endpoint:user-artifact',
  // Removed in 9.1 https://github.com/elastic/kibana/pull/216342
  'investigation',
].sort();
