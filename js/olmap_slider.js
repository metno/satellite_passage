console.log("Start of satellite_passage map script:");
(function($, Drupal, drupalSettings, once) {

  console.log("Attaching satellite_passage script to drupal behaviours:");
  /** Attach the metsis map to drupal behaviours function */
  Drupal.behaviors.satellitePassage = {
    attach: function(context) {
      // $('#map', context).once().each(function() {
      const mapEl = $(once('#map', '[data-satellite-passage]', context));
      mapEl.each(function () {


        //Get the site name
        var site_name = drupalSettings.satellite_passage.site_name;
        console.log(site_name);
        var defzoom = drupalSettings.satellite_passage.defzoom;
        var lon = drupalSettings.satellite_passage.lon;
        var lat = drupalSettings.satellite_passage.lat;
        // define some interesting projections
        // WGS 84 / EPSG Norway Polar Stereographic
        proj4.defs('EPSG:5939', '+proj=stere +lat_0=90 +lat_ts=90 +lon_0=18 +k=0.994 +x_0=2000000 +y_0=2000000 +datum=WGS84 +units=m +no_defs');
        ol.proj.proj4.register(proj4);
        var proj5939 = ol.proj.get('EPSG:5939');
        var ex5939 = [-7021620.2399999998, -6741017.03, 10047367.779999999, 8027970.99];
        proj5939.setExtent(ex5939);
        ol.proj.addProjection(proj5939);

        // WGS 84 -- WGS84 - World Geodetic System 1984
/*        proj4.defs('EPSG:4326', '+proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees');
        ol.proj.proj4.register(proj4);
        var proj4326 = ol.proj.get('EPSG:4326');
        var ex4326 = [-90, 30, 90, 90];
        proj4326.setExtent(ex4326);
        ol.proj.addProjection(proj4326);
*/
        // WGS 84 / North Pole LAEA Europe
        proj4.defs('EPSG:3575', '+proj=laea +lat_0=90 +lon_0=10 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');
        ol.proj.proj4.register(proj4);
        var proj3575 = ol.proj.get('EPSG:3575');
        var ex3575 = [-3e+06, -3e+06, 7e+06, 7e+06];
        proj3575.setExtent(ex3575);
        ol.proj.addProjection(proj3575);

        // WGS 84 / UPS North (N,E)
    /*    proj4.defs('EPSG:32661', '+proj=sterea +lat_0=90 +lat_ts=90 +lon_0=0 +k=0.994 +x_0=2000000 +y_0=2000000 +datum=WGS84 +units=m +no_defs');
        ol.proj.proj4.register(proj4);
        var proj32661 = ol.proj.get('EPSG:32661');
        var ex32661 = [-4e+06, -6e+06, 8e+06, 8e+06];
        proj32661.setExtent(ex32661);
        ol.proj.addProjection(proj32661);
*/
/*
        proj4.defs(
  'EPSG:3413',
  '+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 ' +
    '+x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'
);
    ol.proj.proj4.register(proj4);
var proj3413 = ol.proj.get('EPSG:3413');
proj3413.setExtent([-4194304, -4194304, 4194304, 4194304]);
*/

// 32661
/* proj4.defs('EPSG:32661', '+proj=stere +lat_0=90 +lat_ts=90 +lon_0=0 +k=0.994 +x_0=2000000 +y_0=2000000 +datum=WGS84 +units=m +no_defs');
ol.proj.proj4.register(proj4);
var ext32661 = [-6e+06, -3e+06, 9e+06, 6e+06];
var center32661 = [0.0, 80.0];
var proj32661 = new ol.proj.Projection({
  code: 'EPSG:32661',
  extent: ext32661
});
*/

// WGS 84 / UPS North (N,E)
proj4.defs('EPSG:32661', '+proj=stere +lat_0=90 +lat_ts=90 +lon_0=0 +k=0.994 +x_0=2000000 +y_0=2000000 +ellps=WGS84 +datum=WGS84 +units=m +no_defs ');
ol.proj.proj4.register(proj4);
var proj32661 = ol.proj.get('EPSG:32661');
var ex32661 = [-4e+06, -6e+06, 8e+06, 8e+06];
proj32661.setExtent(ex32661);
proj32661.setGlobal(true);
ol.proj.addProjection(proj32661);

var ext = ex32661;
var prj = proj32661;

        //var ext = ex5939;
        //var prj = proj5939;
        //var ext = ext32661;
        //var prj = proj32661;
        //var ext = ex3575;
        ///var prj = proj3575;
        //var ext = ex4326;
        //var prj = proj4326;
        //var prj = proj3413;
        //var ext =  proj3413.getExtent();
        var tromsoLonLat = [lon, lat];
        //var tromsoLonLat = [68.0, 19.0];
        var tromsoTrans = ol.proj.transform(tromsoLonLat, "EPSG:4326", prj);


        var layer = {};

        // Base layer WMS
        layer['base'] = new ol.layer.Tile({
          title: 'base',
          baseLayer: true,
          //displayInLayerSwitcher: false,
          type: 'base',
          source: new ol.source.OSM({
          })
        });

        var stamenTerrain = new ol.layer.Tile({
          title: "stamenTerrain",
          baseLayer: true,
          //visible: false,
          source: new ol.source.XYZ({
            attributions: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
            url: 'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
            crossOrigin: 'anonymous',
          }),
        });

        // feature layer KML
        layer['kml1A'] = new ol.layer.Vector({
          title: 'Sentinel-1A',
          opacity: 0.4,
          source: new ol.source.Vector({
            //projection: 'EPSG:4326',
            url: '/sites/'+ site_name +'/files/kml/S1A_acquisition_plan_norwAOI.kml',
            format: new ol.format.KML({
              extractStyles: false,
              extractAttributes: true
            }),
          })
        })

        // feature layer KML
        layer['kml1B'] = new ol.layer.Vector({
          title: 'Sentinel-1B',
          opacity: 0.4,
          source: new ol.source.Vector({
            //projection: 'EPSG:4326',
            url: '/sites/'+ site_name +'/files/kml/S1B_acquisition_plan_norwAOI.kml',
            format: new ol.format.KML({
              extractStyles: false,
              extractAttributes: true
            }),
          })
        })
        // feature layer KML
        layer['kml2A'] = new ol.layer.Vector({
          title: 'Sentinel-2A',
          opacity: 0.4,
          source: new ol.source.Vector({
            //projection: 'EPSG:4326',
            url: '  /sites/'+ site_name +'/files/kml/S2A_acquisition_plan_norwAOI.kml',
            format: new ol.format.KML({
              extractStyles: false,
              extractAttributes: true
            }),
          })
        })

        // feature layer KML
        layer['kml2B'] = new ol.layer.Vector({
          title: 'Sentinel-2B',
          opacity: 0.4,
          source: new ol.source.Vector({
            //wrapX: true,
            //projection: 'EPSG:4326',
            url: '/sites/'+ site_name +'/files/kml/S2B_acquisition_plan_norwAOI.kml',
            format: new ol.format.KML({
              extractStyles: false,
              extractAttributes: true
            }),
          })
        })


        // build up the map
        var map = new ol.Map({
          controls: ol.control.defaults().extend([
            new ol.control.FullScreen()
          ]),
          target: 'map',
          layers: [
            layer['base'],
            //stamenTerrain,
            layer['kml1A'],
            layer['kml1B'],
            layer['kml2A'],
            layer['kml2B']
          ],
          view: new ol.View({
            zoom: defzoom,
            minZoom: 1,
            mazZoom:  8,
            center: tromsoTrans,
            //projection: 'EPSG:32661',
            extent: ext,
            projection: prj,
          })
        });
        console.log("Created map with projection object: ");
        console.log(prj);

        var layerSwitcher = new ol.control.LayerSwitcher({
          collapsed: false,
          reordering: false,
        });
        map.addControl(layerSwitcher);

        //Mouseposition
        var mousePositionControl = new ol.control.MousePosition({
          coordinateFormat: function(co) {
            return ol.coordinate.format(co, template = 'lon: {x}, lat: {y}', 2);
          },
          projection: 'EPSG:4326', //Map hat 3857
        });
        map.addControl(mousePositionControl);

        //Define styles for pixel which are not default
        // Empty for no feature & out of time range
        var styleEmpty = new ol.style.Style({})
        // Red for S2 feature with mouse or click
        var styleRed = new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: '#f00',
            width: 1
          }),
          fill: new ol.style.Fill({
            color: 'rgba(255,0,0,0.3)'
          })
        })
        // Blue for S1 sea feature with mouse or click
        var styleBlue = new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: '#00f',
            width: 1
          }),
          fill: new ol.style.Fill({
            color: 'rgba(0,0,255,0.3)'
          })
        })
        // Green for S1 land feature with mouse or click
        var styleGreen = new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: '#0f0',
            width: 1
          }),
          fill: new ol.style.Fill({
            color: 'rgba(0,255,0,0.3)'
          })
        })

        // Define the start/end from the sliders
        var timeSelectStart = document.getElementById('timeStartKml');
        var timeSelectEnd = document.getElementById('timeEndKml');


        // Get the observation time from the kml file
        function updateTimeSelection(endChanged) {

          var minObs, maxObs;
          for (var i12 = 1; i12 <= 4; i12++) {
            map.getLayers().getArray()[i12].getSource().forEachFeature(function(feature) {
              var obsTime = new Date(feature.get('ObservationTimeStart'));
              if (minObs === undefined || obsTime < minObs)
                minObs = obsTime;
              if (maxObs === undefined || obsTime > maxObs)
                maxObs = obsTime;
            });
          }
          // retrieve the start/end values as number and not string, according to user selection
          // define today
          var startVal = parseInt(timeSelectStart.value);
          var endVal = parseInt(timeSelectEnd.value);
          // make sure that the end time is always before the end time. If not that update the values.
          if (startVal >= endVal) {
            if (endChanged) {
              timeSelectStart.value = endVal;
            } else {
              timeSelectEnd.value = startVal;
            }
          }
          // compute the time selected with the slider
          var selectedTimeStart = new Date((100 - startVal) / 100 * minObs + startVal / 100 * maxObs);
          var selectedTimeEnd = new Date((100 - endVal) / 100 * minObs + endVal / 100 * maxObs);
          // loop through features, hide those earlier than time
          for (var i12 = 1; i12 <= 4; i12++) {
            map.getLayers().getArray()[i12].getSource().forEachFeature(function(feature) {
              var obsTime = new Date(feature.get('ObservationTimeStart'));
              if (obsTime < selectedTimeStart || obsTime > selectedTimeEnd) {
                feature.setStyle(styleEmpty);
              } else {
                feature.setStyle();
              }
            });
          }
          var boxEnd = document.getElementById('boxEnd');
          var boxStart = document.getElementById('boxStart');
          // print and update the selected date only when moving the slider
          if (endChanged) {
            boxEnd.value = selectedTimeEnd;
            if (startVal >= endVal)
              boxStart.value = selectedTimeEnd;
          } else {
            boxStart.value = selectedTimeStart;
            if (startVal >= endVal)
              boxEnd.value = selectedTimeStart;
          }
        }
        //Update time of the selector
    /*    timeSelectStart.onchange = function() {
          updateTimeSelection(false);
        };
        timeSelectEnd.onchange = function() {
          updateTimeSelection(true);
        };
*/
        $('#timeStartKml').on('input', function() {updateTimeSelection(false)});
        $('#timeEndKml').on('input', function() {updateTimeSelection(true)});


        // Get the observation time from the kml file
        function updateTimeSelectionLayer(endChanged,layer) {
          var minObs, maxObs;
            layer.getSource().forEachFeature(function(feature) {
              var obsTime = new Date(feature.get('ObservationTimeStart'));
              if (minObs === undefined || obsTime < minObs)
                minObs = obsTime;
              if (maxObs === undefined || obsTime > maxObs)
                maxObs = obsTime;
            });

          // retrieve the start/end values as number and not string, according to user selection
          // define today
          var startVal = parseInt(timeSelectStart.value);
          var endVal = parseInt(timeSelectEnd.value);
          // make sure that the end time is always before the end time. If not that update the values.
          if (startVal >= endVal) {
            if (endChanged) {
              timeSelectStart.value = endVal;
            } else {
              timeSelectEnd.value = startVal;
            }
          }
          // compute the time selected with the slider
          var selectedTimeStart = new Date((100 - startVal) / 100 * minObs + startVal / 100 * maxObs);
          var selectedTimeEnd = new Date((100 - endVal) / 100 * minObs + endVal / 100 * maxObs);
          // loop through features, hide those earlier than time
          layer.getSource().forEachFeature(function(feature) {
              var obsTime = new Date(feature.get('ObservationTimeStart'));
              if (obsTime < selectedTimeStart || obsTime > selectedTimeEnd) {
                feature.setStyle(styleEmpty);
              } else {
                feature.setStyle();
              }
            });

          // print and update the selected date only when moving the slider
          if (endChanged) {
            boxEnd.value = selectedTimeEnd;
            if (startVal >= endVal)
              boxStart.value = selectedTimeEnd;
          } else {
            boxStart.value = selectedTimeStart;
            if (startVal >= endVal)
              boxEnd.value = selectedTimeStart;
          }
        }
        //Update time of the selector
       timeSelectStart.onchange = function() {
          updateTimeSelection(false);
        };
        timeSelectEnd.onchange = function() {
          updateTimeSelection(true);
        };


        // Define the position of today to set the start value of the slider
        function initialize_today() {
          var today = new Date();
          var minObs, maxObs;
          for (var i12 = 1; i12 <= 4; i12++) {
            map.getLayers().getArray()[i12].getSource().forEachFeature(function(feature) {

                var obsTime = new Date(feature.get('ObservationTimeStart'));
                if (minObs === undefined || obsTime < minObs)
                  minObs = obsTime;
                if (maxObs === undefined || obsTime > maxObs)
                  maxObs = obsTime;

            });
          }
          place = (today - minObs) * (100 / (maxObs - minObs));
          return place;
        };


        // Define the position of today to set the start value of the slider
        function initialize_today_layer(layer) {
          var today = new Date();
          var minObs, maxObs;
          layer.getSource().forEachFeature(function(feature) {

                var obsTime = new Date(feature.get('ObservationTimeStart'));
                if (minObs === undefined || obsTime < minObs)
                  minObs = obsTime;
                if (maxObs === undefined || obsTime > maxObs)
                  maxObs = obsTime;

            });

          place = (today - minObs) * (100 / (maxObs - minObs));
          return place;
        }

        var listenerKey = {};

        // kml layer might not be loaded when looking for printing the date: need to listen to
        // the kml source until it is ready.
        function listenerAllLayers() {
          if (layer["kml1A"].getSource().getRevision() >= 1 &&
            layer["kml1B"].getSource().getRevision() >= 1 &&
            layer["kml2A"].getSource().getRevision() >= 1 &&
            layer["kml2B"].getSource().getRevision() >= 1) {
            //if all layers are ready then stop listeing for changes
            //layer["kml1A"].getSource().unset('change');
            //layer["kml1B"].getSource().unset('change');
            //layer["kml2A"].getSource().unset('change');
            //layer["kml2B"].getSource().unset('change');
            console.log("unsetting listeners");
            layer["kml1A"].getSource().unset(listenerKey["kml1A"],true);
            layer["kml1B"].getSource().unset(listenerKey["kml1B"],true);
            layer["kml2A"].getSource().unset(listenerKey["kml2A"],true);
            layer["kml2B"].getSource().unset(listenerKey["kml2B"],true);
            // do something with the source
            //timeSelectStart.value = initialize_today();
            updateTimeSelection(false);
            updateTimeSelection(true);
          }
        }

        // kml layer might not be loaded when looking for printing the date: need to listen to
        // the kml source until it is ready.
        map.getLayers().forEach(function (layer,index ,array ) {
          if(index >= 1) {
            let vectorSource = layer.getSource()
            vectorSource.once('change', function(){
              if (vectorSource.getState() === 'ready') {
                console.log("Got ready state for layer: " +layer.get('title'));
                console.log("Updating time information....");
                timeSelectStart.value = initialize_today();
                updateTimeSelection(false);
                updateTimeSelection(true);
                this.refresh();
              }
            });




          }

        });

        // build elements of listenerKey for each layer
        //listenerKey["kml1A"] = layer["kml1A"].getSource().on('change', listenerAllLayers);
        //listenerKey["kml1B"] = layer["kml1B"].getSource().on('change', listenerAllLayers);
        //listenerKey["kml2A"] = layer["kml2A"].getSource().on('change', listenerAllLayers);
        //listenerKey["kml2B"] = layer["kml2B"].getSource().on('change', listenerAllLayers);


        var viewProjSelect = document.getElementById('view-projection');

        function updateViewProjection() {
          var newProj = ol.proj.get(viewProjSelect.value);
          var newProjExtent = newProj.getExtent();
          var newView = new ol.View({
            projection: newProj,
            center: ol.proj.transform(tromsoLonLat, "EPSG:4326", newProj),
            zoom: 2.5,
            minZoom: 2,
            extent: newProjExtent || undefined
          });
          map.setView(newView);
        };

        //viewProjSelect.onchange = function() {
        //  updateViewProjection();
        //};

        //updateViewProjection();


        //var info = $('#info');
        var info = document.getElementById("info");
        window.lara_info = info;

        // Create the function that manages the passing and clicking of the mouse. When only passing the doPopup is false, when clicking the doPopup
        // is true. In addition when passing by with the mouse the feature changes color.
        var displayFeatureInfo = function(pixel, doPopup) {
          // define the four layers for S1A, S1B, S2A and S2B
          var s1a_layer = map.getLayers().getArray()[1];
          var s1b_layer = map.getLayers().getArray()[2];
          var s2a_layer = map.getLayers().getArray()[3];
          var s2b_layer = map.getLayers().getArray()[4];

          if (doPopup) {}
          for (var i12 = 1; i12 <= 4; i12++) {
            map.getLayers().getArray()[i12].getSource().forEachFeature(function(feature) {
              // for the visible features (depending on time range) get the default style
              if (feature.getStyle() !== styleEmpty) {
                feature.setStyle();
              }
            });
          }

          var feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
            // all 2A and 2B: Red
            if (layer === s2a_layer || layer === s2b_layer) {
              feature.setStyle(styleRed);
              // 1A or 1B with IW mode: Green
            } else if ((layer === s1a_layer || layer === s1b_layer) && feature.get("Mode") === "IW") {
              feature.setStyle(styleGreen);
              // 1A or 1B with IW mode: Blue
            } else if ((layer === s1a_layer || layer === s1b_layer) && feature.get("Mode") === "EW") {
              feature.setStyle(styleBlue);
            }
            return feature;
          });

          var layer = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
            return layer;
          });

          if (feature && doPopup) {
            $('#info').fu_popover("destroy");
            $('#info').css({
              display: "",
              left: pixel[0] + 'px',
              top: pixel[1] + 'px',
              width: '25em',
            });
            if (layer === s2a_layer || layer === s2b_layer) {
              $('#info').fu_popover({
                animation: false,
                trigger: 'manual',
                html: true,
                placement: 'top',
                content: "<table><tr><td>ID                  </td><td>" + feature.get("ID") + "</td></tr>" +
                  "<tr><td>Timeliness          </td><td>" + feature.get("Timeliness") + "</td></tr>" +
                  "<tr><td>Station             </td><td>" + feature.get("Station") + "</td></tr>" +
                  "<tr><td>Mode                </td><td>" + feature.get("Mode") + "</td></tr>" +
                  "<tr><td>ObservationTimeStart</td><td>" + feature.get("ObservationTimeStart") + "</td></tr>" +
                  "<tr><td>ObservationTimeStop </td><td>" + feature.get("ObservationTimeStop") + "</td></tr>" +
                  "<tr><td>ObservationDuration </td><td>" + feature.get("ObservationDuration") + "</td></tr>" +
                  "<tr><td>OrbitAbsolute       </td><td>" + feature.get("OrbitAbsolute") + "</td></tr>" +
                  "<tr><td>OrbitRelative       </td><td>" + feature.get("OrbitRelative") + "</td></tr>" +
                  "<tr><td>Scenes              </td><td>" + feature.get("Scenes") + "</td></tr></table>"
              });
            } else if (layer === s1a_layer || layer === s1b_layer) {
              $('#info').fu_popover({
                animation: false,
                trigger: 'manual',
                html: true,
                placement: 'top',
                content: "<table><tr><td>SatelliteId         </td><td>" + feature.get("SatelliteId") + "</td></tr>" +
                  "<tr><td>DatatakeId          </td><td>" + feature.get("DatatakeId") + "</td></tr>" +
                  "<tr><td>Mode                </td><td>" + feature.get("Mode") + "</td></tr>" +
                  "<tr><td>Swath               </td><td>" + feature.get("Swath") + "</td></tr>" +
                  "<tr><td>Polarisation        </td><td>" + feature.get("Polarisation") + "</td></tr>" +
                  "<tr><td>ObservationTimeStart</td><td>" + feature.get("ObservationTimeStart") + "</td></tr>" +
                  "<tr><td>ObservationTimeStop </td><td>" + feature.get("ObservationTimeStop") + "</td></tr>" +
                  "<tr><td>ObservationDuration </td><td>" + feature.get("ObservationDuration") + "</td></tr>" +
                  "<tr><td>OrbitAbsolute       </td><td>" + feature.get("OrbitAbsolute") + "</td></tr>" +
                  "<tr><td>OrbitRelative       </td><td>" + feature.get("OrbitRelative") + "</td></tr></table>"
              });
            }
            $('#info').fu_popover("show");
          } else if (doPopup) {
            $('#info').fu_popover('destroy');
            $('#info').css({
              display: 'none'
            });
          }
        };

        map.on('pointermove', function(evt) {
          if (evt.dragging) {
            $('#info').fu_popover('destroy');
            return;
          }
          displayFeatureInfo(map.getEventPixel(evt.originalEvent), false);
        });

        map.on('click', function(evt) {
          displayFeatureInfo(evt.pixel, true);
        });


        //        timeSelectStart.value = initialize_today();
        //        updateTimeSelection(false);
        //        updateTimeSelection(true);
      });
    },
  };
})(jQuery, Drupal, drupalSettings, once);
