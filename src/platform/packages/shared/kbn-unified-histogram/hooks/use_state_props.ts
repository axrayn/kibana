/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { DataView, DataViewField, DataViewType } from '@kbn/data-views-plugin/common';
import { AggregateQuery, isOfAggregateQueryType, Query } from '@kbn/es-query';
import { hasTransformationalCommand } from '@kbn/esql-utils';
import type { RequestAdapter } from '@kbn/inspector-plugin/public';
import type { DatatableColumn } from '@kbn/expressions-plugin/common';
import { convertDatatableColumnToDataViewFieldSpec } from '@kbn/data-view-utils';
import { useCallback, useEffect, useMemo } from 'react';
import {
  UnifiedHistogramChartLoadEvent,
  UnifiedHistogramExternalVisContextStatus,
  UnifiedHistogramFetchStatus,
  UnifiedHistogramServices,
  UnifiedHistogramSuggestionContext,
  UnifiedHistogramVisContext,
} from '../types';
import type { UnifiedHistogramStateService } from '../services/state_service';
import {
  chartHiddenSelector,
  timeIntervalSelector,
  totalHitsResultSelector,
  totalHitsStatusSelector,
  lensAdaptersSelector,
  lensDataLoadingSelector$,
  topPanelHeightSelector,
} from '../utils/state_selectors';
import { useStateSelector } from './use_state_selector';
import { setBreakdownField } from '../utils/local_storage_utils';
import { exportVisContext } from '../utils/external_vis_context';
import { UseUnifiedHistogramProps } from './use_unified_histogram';

export const useStateProps = ({
  services,
  localStorageKeyPrefix,
  stateService,
  dataView,
  query,
  searchSessionId,
  requestAdapter,
  columns,
  breakdownField,
  onBreakdownFieldChange: originalOnBreakdownFieldChange,
  onVisContextChanged: originalOnVisContextChanged,
}: {
  services: UnifiedHistogramServices;
  localStorageKeyPrefix: string | undefined;
  stateService: UnifiedHistogramStateService | undefined;
  dataView: DataView;
  query: Query | AggregateQuery | undefined;
  searchSessionId: string | undefined;
  requestAdapter: RequestAdapter | undefined;
  columns: DatatableColumn[] | undefined;
  breakdownField: string | undefined;
  onBreakdownFieldChange: ((breakdownField: string | undefined) => void) | undefined;
  onVisContextChanged:
    | ((
        nextVisContext: UnifiedHistogramVisContext | undefined,
        externalVisContextStatus: UnifiedHistogramExternalVisContextStatus
      ) => void)
    | undefined;
}) => {
  const topPanelHeight = useStateSelector(stateService?.state$, topPanelHeightSelector);
  const chartHidden = useStateSelector(stateService?.state$, chartHiddenSelector);
  const timeInterval = useStateSelector(stateService?.state$, timeIntervalSelector);
  const totalHitsResult = useStateSelector(stateService?.state$, totalHitsResultSelector);
  const totalHitsStatus = useStateSelector(stateService?.state$, totalHitsStatusSelector);
  const lensAdapters = useStateSelector(stateService?.state$, lensAdaptersSelector);
  const lensDataLoading$ = useStateSelector(stateService?.state$, lensDataLoadingSelector$);

  /**
   * Contexts
   */

  const isPlainRecord = useMemo(() => {
    return query && isOfAggregateQueryType(query);
  }, [query]);

  const isTimeBased = useMemo(() => {
    return dataView && dataView.type !== DataViewType.ROLLUP && dataView.isTimeBased();
  }, [dataView]);

  const hits = useMemo(() => {
    if (totalHitsResult instanceof Error) {
      return undefined;
    }

    return {
      status: totalHitsStatus,
      total: totalHitsResult,
    };
  }, [totalHitsResult, totalHitsStatus]);

  const chart = useMemo(() => {
    if (!isTimeBased && !isPlainRecord) {
      return undefined;
    }

    return {
      hidden: chartHidden,
      timeInterval,
    };
  }, [chartHidden, isPlainRecord, isTimeBased, timeInterval]);

  const breakdown = useMemo(() => {
    if (!isTimeBased) {
      return undefined;
    }

    // hide the breakdown field selector when the ES|QL query has a transformational command (STATS, KEEP etc)
    if (query && isOfAggregateQueryType(query) && hasTransformationalCommand(query.esql)) {
      return undefined;
    }

    if (isPlainRecord) {
      const breakdownColumn = columns?.find((column) => column.name === breakdownField);
      const field = breakdownColumn
        ? new DataViewField(convertDatatableColumnToDataViewFieldSpec(breakdownColumn))
        : undefined;
      return {
        field,
      };
    }

    return {
      field: breakdownField ? dataView?.getFieldByName(breakdownField) : undefined,
    };
  }, [isTimeBased, query, isPlainRecord, breakdownField, dataView, columns]);

  const request = useMemo(() => {
    return {
      searchSessionId,
      adapter: requestAdapter,
    };
  }, [requestAdapter, searchSessionId]);

  /**
   * Callbacks
   */

  const onTopPanelHeightChange = useCallback(
    (newTopPanelHeight: number | undefined) => {
      stateService?.setTopPanelHeight(newTopPanelHeight);
    },
    [stateService]
  );

  const onTimeIntervalChange = useCallback(
    (newTimeInterval: string) => {
      stateService?.setTimeInterval(newTimeInterval);
    },
    [stateService]
  );

  const onTotalHitsChange = useCallback(
    (newTotalHitsStatus: UnifiedHistogramFetchStatus, newTotalHitsResult?: number | Error) => {
      stateService?.setTotalHits({
        totalHitsStatus: newTotalHitsStatus,
        totalHitsResult: newTotalHitsResult,
      });
    },
    [stateService]
  );

  const onChartHiddenChange = useCallback(
    (newChartHidden: boolean) => {
      stateService?.setChartHidden(newChartHidden);
    },
    [stateService]
  );

  const onChartLoad = useCallback(
    (event: UnifiedHistogramChartLoadEvent) => {
      // We need to store the Lens request adapter in order to inspect its requests
      stateService?.setLensRequestAdapter(event.adapters.requests);
      stateService?.setLensAdapters(event.adapters);
      stateService?.setLensDataLoading$(event.dataLoading$);
    },
    [stateService]
  );

  const onBreakdownFieldChange = useCallback(
    (newBreakdownField: DataViewField | undefined) => {
      originalOnBreakdownFieldChange?.(newBreakdownField?.name);
    },
    [originalOnBreakdownFieldChange]
  );

  const onSuggestionContextChange = useCallback(
    (suggestionContext: UnifiedHistogramSuggestionContext | undefined) => {
      stateService?.setCurrentSuggestionContext(suggestionContext);
    },
    [stateService]
  );

  const onVisContextChanged: UseUnifiedHistogramProps['onVisContextChanged'] = useMemo(() => {
    if (!originalOnVisContextChanged || !isPlainRecord) {
      return undefined;
    }

    return (visContext, externalVisContextStatus) => {
      const minifiedVisContext = exportVisContext(visContext);

      originalOnVisContextChanged(minifiedVisContext, externalVisContextStatus);
    };
  }, [isPlainRecord, originalOnVisContextChanged]);

  /**
   * Effects
   */

  // Sync the breakdown field with local storage
  useEffect(() => {
    if (localStorageKeyPrefix) {
      setBreakdownField(services.storage, localStorageKeyPrefix, breakdownField);
    }
  }, [breakdownField, localStorageKeyPrefix, services.storage]);

  // Clear the Lens request adapter when the chart is hidden
  useEffect(() => {
    if (chartHidden || !chart) {
      stateService?.setLensRequestAdapter(undefined);
    }
  }, [chart, chartHidden, stateService]);

  return {
    topPanelHeight,
    hits,
    chart,
    breakdown,
    request,
    isPlainRecord,
    lensAdapters,
    dataLoading$: lensDataLoading$,
    onTopPanelHeightChange,
    onTimeIntervalChange,
    onTotalHitsChange,
    onChartHiddenChange,
    onChartLoad,
    onBreakdownFieldChange,
    onSuggestionContextChange,
    onVisContextChanged,
  };
};
