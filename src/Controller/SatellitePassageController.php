<?php

namespace Drupal\satellite_passage\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\File\FileUrlGeneratorInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Controller for showing the aquasition plan map.
 */
class SatellitePassageController extends ControllerBase {
  /**
   * The file URL generator.
   *
   * @var \Drupal\Core\File\FileUrlGeneratorInterface
   */
  protected FileUrlGeneratorInterface $fileUrlGenerator;

  /**
   * {@inheritdoc}
   */
  public function __construct(FileUrlGeneratorInterface $file_url_generator) {
    $this->fileUrlGenerator = $file_url_generator;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): self {
    return new self($container->get('file_url_generator'));
  }

  /**
   * Render the map to the page.
   */
  public function render() {
    $config = $this->config('system.site');
    $site_name = $config->get('name');
    $config = $this->config('satellite_passage.configuration');
    $defzoom = $config->get('defzoom');
    $lat = $config->get('lat');
    $lon = $config->get('lon');
    $helptext = [
      '#type' => 'processed_text',
      '#text' => $config->get('helptext.value'),
      '#format' => $config->get('helptext.format'),
    ];

    return [
      '#type' => 'container',
      '#theme' => 'satellite_passage-template',
      '#site_name' => $site_name,
      '#helptext' => $helptext,
      '#attached' => [
        'library' => [
          'satellite_passage/satellite_passage',
        ],

        'drupalSettings' => [
          'satellite_passage' => [
            'kmlBaseUrl' => $this->fileUrlGenerator->generateString('public://kml'),
            'lon' => $lon,
            'lat' => $lat,
            'defzoom' => $defzoom,
          ],

        ],
      ],
      '#cache' => [
        'max-age' => 0,
      ],
    ];
  }

}
