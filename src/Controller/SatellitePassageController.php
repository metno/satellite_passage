<?php

namespace Drupal\satellite_passage\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Render\Markup;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Controller for showing the aquasition plan map.
 */
class SatellitePassageController extends ControllerBase {
  /**
   * The request stack service.
   *
   * @var Symfony\Component\HttpFoundation\RequestStack
   */
  protected $request;

  /**
   * {@inheritdoc}
   */
  public function __construct(RequestStack $request) {
    $this->request = $request;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    // $instance = parent::create($container);
    // $instance->request = $container->get('request_stack');
    // return $instance;
    return new static($container->get('request_stack'));
  }

  /**
   * Render the map to the page.
   */
  public function render() {
    $config = $this->config('system.site');
    $site_name = $config->get('name');
    // dpm($site_name);
    $host = $this->request->getCurrentRequest()->getHost();
    // dpm($host);
    /* Handle .ddev.site special for local development */
    if (str_contains($host, 'ddev.site')) {
      $host = 'default';
    }
    $config = $this->config('satellite_passage.configuration');
    $defzoom = $config->get('defzoom');
    $lat = $config->get('lat');
    $lon = $config->get('lon');
    $helptext = Markup::create($config->get('helptext')['value']);

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
            'site_name' => $host,
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
