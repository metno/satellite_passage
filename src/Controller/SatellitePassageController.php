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

        return [
            '#type' => 'container',
            '#theme' => 'satellite_passage-template',
            '#site_name' => $site_name,
            '#attached' => [
              'library' => [
                'satellite_passage/satellite_passage',
              ],


            'drupalSettings' => [
              'satellite_passage' => [
                'site_name' => $site_name,
              ]

          ],
          ],
          '#cache' => [
            'max-age' => 0,
          ],
        ];
    }

}
