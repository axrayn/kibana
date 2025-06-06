/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import expect from '@kbn/expect';

import { FtrProviderContext } from '../ftr_provider_context';

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const esArchiver = getService('esArchiver');
  const { common, discover } = getPageObjects(['common', 'discover']);
  const kibanaServer = getService('kibanaServer');
  const security = getService('security');
  const browser = getService('browser');
  const from = 'Jan 1, 2019 @ 00:00:00.000';
  const to = 'Jan 1, 2019 @ 23:59:59.999';

  describe('date_nanos_mixed', function () {
    before(async function () {
      await esArchiver.loadIfNeeded(
        'src/platform/test/functional/fixtures/es_archiver/date_nanos_mixed'
      );
      await kibanaServer.savedObjects.clean({ types: ['search', 'index-pattern'] });
      await kibanaServer.importExport.load(
        'src/platform/test/functional/fixtures/kbn_archiver/date_nanos_mixed'
      );
      await kibanaServer.uiSettings.replace({
        defaultIndex: 'timestamp-*',
        hideAnnouncements: true, // should be enough vertical space to render rows
      });
      await browser.setWindowSize(1200, 900);
      await security.testUser.setRoles(['kibana_admin', 'kibana_date_nanos_mixed']);
      await common.setTime({ from, to });
      await common.navigateToApp('discover');
    });

    after(async () => {
      await security.testUser.restoreDefaults();
      await esArchiver.unload('src/platform/test/functional/fixtures/es_archiver/date_nanos_mixed');
      await kibanaServer.savedObjects.clean({ types: ['search', 'index-pattern'] });
      await common.unsetTime();
    });

    it('shows a list of records of indices with date & date_nanos fields in the right order', async function () {
      const rowData1 = await discover.getDocTableIndex(1);
      expect(rowData1).to.contain('Jan 1, 2019 @ 12:10:30.124000000');
      const rowData2 = await discover.getDocTableIndex(2);
      expect(rowData2).to.contain('Jan 1, 2019 @ 12:10:30.123498765');
      const rowData3 = await discover.getDocTableIndex(3);
      expect(rowData3).to.contain('Jan 1, 2019 @ 12:10:30.123456789');
      const rowData4 = await discover.getDocTableIndex(4);
      expect(rowData4).to.contain('Jan 1, 2019 @ 12:10:30.123000000');
    });
  });
}
