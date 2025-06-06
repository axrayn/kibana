/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';

import { ErrorCode } from '../../common/types/error_codes';
import { fetchMapping } from '../lib/fetch_mapping';
import type { SearchConnectorsPluginSetupDependencies } from '../config';
import { elasticsearchErrorHandler } from '../utils/elasticsearch_error_handler';
import { isIndexNotFoundException } from '../utils/identify_exceptions';
import { createError } from '../utils/create_error';

export function registerMappingRoute({ router, log }: SearchConnectorsPluginSetupDependencies) {
  router.get(
    {
      path: '/internal/content_connectors/mappings/{index_name}',
      security: {
        authz: {
          enabled: false,
          reason: 'This route delegates authorization to the scoped ES client',
        },
      },
      validate: {
        params: schema.object({
          index_name: schema.string(),
        }),
      },
    },
    elasticsearchErrorHandler(log, async (context, request, response) => {
      const { client } = (await context.core).elasticsearch;

      try {
        const mapping = await fetchMapping(client, request.params.index_name);

        return response.ok({
          body: mapping,
          headers: { 'content-type': 'application/json' },
        });
      } catch (error) {
        if (isIndexNotFoundException(error)) {
          return createError({
            errorCode: ErrorCode.INDEX_NOT_FOUND,
            message: 'Could not found index',
            response,
            statusCode: 404,
          });
        }
        throw error;
      }
    })
  );
}
