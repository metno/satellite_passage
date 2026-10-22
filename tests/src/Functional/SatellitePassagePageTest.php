<?php

namespace Drupal\Tests\satellite_passage\Functional;

use Drupal\Tests\BrowserTestBase;
use Drupal\filter\Entity\FilterFormat;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests the public satellite acquisition map page.
 *
 * @group satellite_passage
 */
#[RunTestsInSeparateProcesses]
class SatellitePassagePageTest extends BrowserTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['satellite_passage'];

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    FilterFormat::create([
      'format' => 'basic_html',
      'name' => 'Basic HTML',
      'filters' => [
        'filter_html' => [
          'status' => TRUE,
          'settings' => ['allowed_html' => '<p> <a href> <strong>'],
        ],
      ],
    ])->save();
  }

  /**
   * The acquisition page exposes the map and its controls to visitors.
   */
  public function testAcquisitionPage(): void {
    $this->drupalLogin($this->drupalCreateUser(['access content']));
    $this->drupalGet('/services/acquisition');

    $this->assertSession()->statusCodeEquals(200);
    $this->assertSession()->elementExists('css', '[data-satellite-passage]');
    $this->assertSession()->elementExists('css', '#map');
    $this->assertSession()->elementExists('css', '#timeStartKml');
    $this->assertSession()->elementExists('css', '#timeEndKml');
    $this->assertSession()->elementExists('css', '[data-acquisition-details]');
    $this->assertSession()->elementExists('css', '[data-acquisition-popup][hidden][role="dialog"]');
    $this->assertSession()->elementExists('css', '[data-popup-close][aria-label="Close acquisition details"]');
    $this->assertSession()->elementExists('css', '[data-acquisition-details][tabindex="0"]');
    $this->assertSession()->responseContains('Sentinel-1C');
    $this->assertSession()->responseContains('Sentinel-2C');
    $this->assertSession()->responseContains('Use the satellite checkboxes');
    $this->assertSession()->elementAttributeContains('css', '#timeStartKml', 'step', 'any');
    $this->assertSession()->elementAttributeContains('css', '#timeEndKml', 'step', 'any');
    $this->assertSession()->responseContains('Acquisition start (UTC)');
    $this->assertSession()->responseContains('Acquisition end (UTC)');

    $settings = $this->getDrupalSettings();
    $this->assertSame(
      '/' . $this->siteDirectory . '/files/kml',
      $settings['satellite_passage']['kmlBaseUrl'],
    );
  }

  /**
   * Help text is rendered using its configured text format.
   */
  public function testHelpTextFormat(): void {
    $this->config('satellite_passage.configuration')
      ->set('helptext.value', '<p>Custom acquisition help</p><script>alert("unsafe")</script>')
      ->save();
    $this->drupalLogin($this->drupalCreateUser(['access content']));
    $this->drupalGet('/services/acquisition');

    $this->assertSession()->elementTextContains('css', '.satellite-passage__help', 'Custom acquisition help');
    $this->assertSession()->elementNotExists('css', '.satellite-passage__help script');
  }

  /**
   * The page works with Solo when that optional theme is available.
   */
  public function testSoloTheme(): void {
    if (!$this->container->get('extension.list.theme')->exists('solo')) {
      $this->markTestSkipped('The optional Solo theme is not available.');
    }
    $this->container->get('theme_installer')->install(['solo']);
    $this->config('system.theme')->set('default', 'solo')->save();
    $this->drupalLogin($this->drupalCreateUser(['access content']));
    $this->drupalGet('/services/acquisition');

    $this->assertSession()->statusCodeEquals(200);
    $this->assertSession()->elementExists('css', '#map');
    $this->assertSession()->elementsCount('css', '[data-satellite-layer]', 5);
    $this->assertSession()->elementExists('css', '#timeStartKml');
    $this->assertSession()->elementExists('css', '#timeEndKml');
    $this->assertSession()->elementExists('css', '[data-acquisition-popup][hidden][role="dialog"]');
    $this->assertSession()->responseContains('Use the satellite checkboxes');
  }

  /**
   * Updates add satellite names without replacing customized instructions.
   */
  public function testCustomizedHelpUpdate(): void {
    $helptext = '<p>Custom Norwegian area of interst: Sentinel-1A and Sentinel-1B; Sentinel-2A and Sentinel-2B.</p>';
    $this->config('satellite_passage.configuration')
      ->set('helptext.value', $helptext)
      ->save();
    $this->container->get('module_handler')->loadInclude('satellite_passage', 'install');

    satellite_passage_update_9001();
    satellite_passage_update_9002();

    $updated = $this->config('satellite_passage.configuration')->get('helptext.value');
    $this->assertSame(
      '<p>Custom Norwegian area of interst: Sentinel-1A and Sentinel-1C; Sentinel-2A, Sentinel-2B, and Sentinel-2C.</p>',
      $updated,
    );
    satellite_passage_update_9001();
    satellite_passage_update_9002();
    $this->assertSame($updated, $this->config('satellite_passage.configuration')->get('helptext.value'));
  }

}
