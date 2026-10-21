# Satellite Passage for Drupal 10.3, 11, and 12

Author: Lara Ferrighi, <laraf@met.no>

Ported to Drupal 8/9/10 by Magnar Martinsen, <magnarem@met.no>

This module uses an OpenLayers map to display Sentinel-1 and Sentinel-2 acquisition plans retrieved from ESA:

- <https://sentinel.esa.int/web/sentinel/missions/sentinel-1/observation-scenario/acquisition-segments>
- <https://sentinel.esa.int/web/sentinel/missions/sentinel-2/acquisition-plans>

The KML files are filtered to provide detailed information about planned Sentinel acquisitions within the Norwegian area of interest. Each file usually covers 10-15 days. Use the Start and End sliders below the map to filter by acquisition time.

To know more about the satellite acquisition (i.e. ID, Mode, Observation Time, ect...) click on the passage stripe. When passing with the mouse on the passage stripe:

- Passages of Sentinel-2A, Sentinel-2B, and Sentinel-2C are highlighted in red.
- Passages of Sentinel-1A and Sentinel-1C are highlighted in blue for EW mode (sea) and green for IW mode (land).

Use the satellite checkboxes above the map to show or hide individual satellites. All displayed observation times are UTC.

Click a passage to open a compact popup on the map, without scrolling below the sliders. The popup shows all acquisition fields without a scrollbar when space allows; on small screens, its content scrolls only when needed to fit the map. It pans into view near the map edges. Close it with its close button, Escape, or a click on empty map space. Changing the time or satellite filters also dismisses it.

## Dependencies

The module uses Drupal's `vite` contrib module and a Vite-built OpenLayers 10 application. Acquisition KML files must be placed in Drupal's `public://kml` directory (`web/sites/default/files/kml` in the default DDEV site):

- `S1A_acquisition_plan_norwAOI.kml`
- `S1C_acquisition_plan_norwAOI.kml`
- `S2A_acquisition_plan_norwAOI.kml`
- `S2B_acquisition_plan_norwAOI.kml`
- `S2C_acquisition_plan_norwAOI.kml`

KML files are harvested using <https://github.com/hevgyrt/harvest_sentinel_acquisition_plans>.

## Frontend development

Install frontend dependencies and run the Vite development server from the repository root.

For DDEV, add the following inside the existing DDEV condition in your site's `settings.php`. These site-wide settings configure **both** the map entrypoint and Vite's separate HMR client library; configuring only this module's library leaves the HMR client pointing at browser-localhost.

```php
$settings['vite']['devServerUrl'] = 'https://satellite-passage.ddev.site:5173';
$settings['vite']['devServerProbeUrl'] = 'http://localhost:5173';
```

Then start the frontend server:

```sh
npm install
npm run dev
```

Run these commands inside the DDEV web container (`ddev ssh`, or prefix commands with `ddev exec`). Use Node.js 20.19+ or 22.12+.

After starting Vite, run `drush cr` in another terminal and open the **Drupal page** at <https://satellite-passage.ddev.site/services/acquisition>, not the Vite server directly. The DDEV configuration exposes Vite assets and HMR at `https://satellite-passage.ddev.site:5173`; the Drupal Vite module probes `http://localhost:5173` inside the web container. Restart DDEV after changing `web_extra_exposed_ports`.

Build production assets and run the focused map utility tests with:

```sh
npm run build
npm test
```

To switch back to built assets, stop the Vite dev server, run `npm run build`, then run `drush cr` and reload the Drupal page. **Clear Drupal's cache on every switch between dev and built assets**, because library definitions are cached. Commit the generated `dist` assets and manifest together with frontend changes.

For production, set `$settings['vite']['useDevServer'] = FALSE;` in the site's `settings.php`, deploy the built assets, and rebuild Drupal's cache.

## How to enable the module

Enable the module. The tool will be available at `<sitename>/services/acquisition`.

For an existing installation, run `drush updb -y` and `drush cr` to update the standard help text. Customized help text can be reviewed in the module's configuration form.

## Drupal tests

In the supplied DDEV environment:

```sh
vendor/bin/phpunit -c web/core/phpunit.xml.dist tests/src/Functional/SatellitePassagePageTest.php
vendor/bin/phpcs src/Controller/SatellitePassageController.php satellite_passage.install tests
```

The test environment uses the PostgreSQL service configured by DDEV. Restart DDEV after changing its `web_environment` values so PHPUnit receives the updated `SIMPLETEST_DB` setting.

The functional suite also checks the acquisition page with Solo when that optional theme is available; otherwise only that test is skipped. Solo is not a module dependency.

## Drupal 12 compatibility note

The module metadata allows Drupal 12, but the currently installed `drupal/vite` 1.5.7 release declares compatibility only with Drupal 10.3 and 11. Drupal 12 installations must wait for a Vite contrib release that declares Drupal 12 support before this module can be enabled there.
