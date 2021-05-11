<?php
/*
 *
 * @file
 * Contains \Drupal\satellite_passage\Form\SatellitePassageConfigurationForm
 *
 * Form for Satellite passage Admin Configuration
 *
 **/
namespace Drupal\satellite_passage\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Component\Utility\UrlHelper;
use Drupal\Core\Url;

/*
 *  * Class ConfigurationForm.
 *
 *  {@inheritdoc}
 *
 *   */
class SatellitePassageConfigurationForm extends ConfigFormBase {

  /*
   * {@inheritdoc}
  */
  protected function getEditableConfigNames() {
    return [
      'satellite_passage.configuration',
      ];
  }

  /*
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'satellite_passage.admin_config_form';
  }

  /*
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('satellite_passage.configuration');
    $form = [];

    $form['defzoom'] = [
      '#type' => 'number',
      '#title' => 'Enter default initial map zoom',
      '#default_value' => $config->get('defzoom'),
    ];

    $form['lon'] = [
      '#type' => 'number',
      '#title' => 'Enter default longitude center map point (EPSG:4326)',
      '#default_value' => $config->get('lon'),
    ];

    $form['lat'] = [
      '#type' => 'number',
      '#title' => 'Enter default latitude center map point (EPSG:4326)',
      '#default_value' => $config->get('lat'),
    ];

    $form['helptext'] = [
      '#type'          => 'text_format',
      '#title'         => $this->t('Help markup text'),
      '#format'        => $config->get('helptext')['format'],
      '#default_value' => $config->get('helptext')['value'],
    ];

    //$form['#attached']['library'][] = 'products_comparison/products_comparison';
    return parent::buildForm($form, $form_state);
 }

  /*
   * {@inheritdoc}
   *
   * NOTE: Implement form validation here
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {

  }

  /*
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {

    /**
     * Save the configuration
    */
    $values = $form_state->getValues();
    $this->configFactory->getEditable('satellite_passage.configuration')
      ->set('helptext', $values['helptext'])
      ->set('defzoom', $values['defzoom'])
      ->set('lat', $values['lat'])
      ->set('lon', $values['lon'])
      ->save();
    parent::submitForm($form, $form_state);
  }
}
