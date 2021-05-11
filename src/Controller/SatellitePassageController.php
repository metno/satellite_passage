<?php
namespace Drupal\satellite_passage\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Render\Markup;
use Drupal\search_api\Entity\Index;
use Drupal\search_api\Query\QueryInterface;
use Solarium\QueryType\Select\Query\Query;
use Drupal\search_api_solr\Plugin\search_api\backend\SearchApiSolrBackend;
use Symfony\Component\HttpFoundation\JsonResponse;
use Drupal\Component\Serialization\Json;


class SatellitePassageController extends ControllerBase {

    public function render(){
        $config = \Drupal::config('system.site');
        $site_name = $config->get('name');
        $host = \Drupal::request()->getHost();

        $config = \Drupal::config('satellite_passage.configuration');
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
