import "ol/ol.css";
import "../css/satellite_passage.css";
import proj4 from "proj4";
import { register } from "ol/proj/proj4.js";
import OlMap from "ol/Map.js";
import View from "ol/View.js";
import Overlay from "ol/Overlay.js";
import TileLayer from "ol/layer/Tile.js";
import VectorLayer from "ol/layer/Vector.js";
import OSM from "ol/source/OSM.js";
import VectorSource from "ol/source/Vector.js";
import KML from "ol/format/KML.js";
import { get as getProjection } from "ol/proj.js";
import FullScreen from "ol/control/FullScreen.js";
import MousePosition from "ol/control/MousePosition.js";
import { fromLonLat } from "ol/proj.js";
import Style from "ol/style/Style.js";
import Fill from "ol/style/Fill.js";
import Stroke from "ol/style/Stroke.js";

import {
  getInitialSliderValue,
  getObservationBounds,
  isInDateRange,
  sliderValueToDate,
} from "./utils.js";

const PROJECTION = "EPSG:32661";
const PROJECTION_DEFINITION =
  "+proj=stere +lat_0=90 +lat_ts=90 +lon_0=0 +k=0.994 +x_0=2000000 +y_0=2000000 +ellps=WGS84 +datum=WGS84 +units=m +no_defs";
const PROJECTION_EXTENT = [-4e6, -6e6, 8e6, 8e6];

const SATELLITES = [
  { id: "S1A", label: "Sentinel-1A", mission: 1, file: "S1A_acquisition_plan_norwAOI.kml" },
  { id: "S1C", label: "Sentinel-1C", mission: 1, file: "S1C_acquisition_plan_norwAOI.kml" },
  { id: "S2A", label: "Sentinel-2A", mission: 2, file: "S2A_acquisition_plan_norwAOI.kml" },
  { id: "S2B", label: "Sentinel-2B", mission: 2, file: "S2B_acquisition_plan_norwAOI.kml" },
  { id: "S2C", label: "Sentinel-2C", mission: 2, file: "S2C_acquisition_plan_norwAOI.kml" },
];

const styleCache = new Map();
const emptyStyle = new Style({});
const instances = new WeakMap();

function formatDate(date) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

function getFeatureStyle(feature, satellite, highlighted) {
  const mode = feature.get("Mode");
  const key = `${satellite.mission}-${mode}-${highlighted}`;
  if (styleCache.has(key)) {
    return styleCache.get(key);
  }

  let color = "#dd3030";
  if (satellite.mission === 1) {
    color = mode === "IW" ? "#138a52" : mode === "EW" ? "#1769aa" : "#7259a5";
  }

  const style = new Style({
    fill: new Fill({
      color: `${color}${highlighted ? "70" : "55"}`,
    }),
    stroke: new Stroke({
      color,
      width: highlighted ? 3 : 1.5,
    }),
  });
  styleCache.set(key, style);
  return style;
}

function addDetails(details, feature, satellite) {
  const fields =
    satellite.mission === 1
      ? [
          [Drupal.t("Satellite"), "SatelliteId"],
          [Drupal.t("Datatake ID"), "DatatakeId"],
          [Drupal.t("Mode"), "Mode"],
          [Drupal.t("Swath"), "Swath"],
          [Drupal.t("Polarisation"), "Polarisation"],
          [Drupal.t("Observation start"), "ObservationTimeStart"],
          [Drupal.t("Observation end"), "ObservationTimeStop"],
          [Drupal.t("Duration"), "ObservationDuration"],
          [Drupal.t("Absolute orbit"), "OrbitAbsolute"],
          [Drupal.t("Relative orbit"), "OrbitRelative"],
        ]
      : [
          [Drupal.t("ID"), "ID"],
          [Drupal.t("Timeliness"), "Timeliness"],
          [Drupal.t("Station"), "Station"],
          [Drupal.t("Mode"), "Mode"],
          [Drupal.t("Observation start"), "ObservationTimeStart"],
          [Drupal.t("Observation end"), "ObservationTimeStop"],
          [Drupal.t("Duration"), "ObservationDuration"],
          [Drupal.t("Absolute orbit"), "OrbitAbsolute"],
          [Drupal.t("Relative orbit"), "OrbitRelative"],
          [Drupal.t("Scenes"), "Scenes"],
        ];
  const table = document.createElement("table");
  const body = document.createElement("tbody");

  for (const [label, key] of fields) {
    const row = document.createElement("tr");
    const headingCell = document.createElement("th");
    const valueCell = document.createElement("td");
    headingCell.scope = "row";
    headingCell.textContent = label;
    valueCell.textContent = String(feature.get(key) ?? Drupal.t("Not available"));
    row.append(headingCell, valueCell);
    body.append(row);
  }

  table.append(body);
  details.replaceChildren(table);
  details.scrollTop = 0;
}

function initializeMap(root, settings) {
  const mapTarget = root.querySelector("#map");
  const status = root.querySelector("[data-map-status]");
  const details = root.querySelector("[data-acquisition-details]");
  const popup = root.querySelector("[data-acquisition-popup]");
  const popupTitle = popup.querySelector("h2");
  const closeButton = popup.querySelector("[data-popup-close]");
  const startSlider = root.querySelector("#timeStartKml");
  const endSlider = root.querySelector("#timeEndKml");
  const startOutput = root.querySelector("#boxStart");
  const endOutput = root.querySelector("#boxEnd");
  const kmlBaseUrl = settings.kmlBaseUrl.replace(/\/$/, "");
  const layersById = new Map();
  const failedSatellites = new Set();
  const pendingSatellites = new Set(SATELLITES.map(({ id }) => id));
  const listeners = new AbortController();
  let observationBounds = null;
  let highlightedFeature = null;

  proj4.defs(PROJECTION, PROJECTION_DEFINITION);
  register(proj4);
  getProjection(PROJECTION).setExtent(PROJECTION_EXTENT);
  getProjection(PROJECTION).setGlobal(true);

  const layers = SATELLITES.map((satellite) => {
    const source = new VectorSource({
      url: `${kmlBaseUrl}/${satellite.file}`,
      format: new KML({ extractStyles: false }),
    });
    const layer = new VectorLayer({
      source,
      opacity: 0.4,
      properties: { satelliteId: satellite.id },
      style: (feature) => {
        const start = sliderValueToDate(startSlider.value, observationBounds);
        const end = sliderValueToDate(endSlider.value, observationBounds);
        if (
          !isInDateRange(feature.get("ObservationTimeStart"), start, end)
        ) {
          return emptyStyle;
        }
        return getFeatureStyle(feature, satellite, feature === highlightedFeature);
      },
    });

    layersById.set(satellite.id, layer);
    source.on("featuresloaderror", () => {
      failedSatellites.add(satellite.label);
      pendingSatellites.delete(satellite.id);
      updateTimeline();
    });
    source.on("featuresloadend", () => {
      pendingSatellites.delete(satellite.id);
      updateTimeline();
    });
    return layer;
  });

  startSlider.disabled = true;
  endSlider.disabled = true;
  status.textContent = Drupal.t("Loading acquisition plans…");

  const map = new OlMap({
    target: mapTarget,
    layers: [new TileLayer({ source: new OSM() }), ...layers],
    view: new View({
      projection: PROJECTION,
      extent: PROJECTION_EXTENT,
      center: fromLonLat([Number(settings.lon), Number(settings.lat)], PROJECTION),
      zoom: Number(settings.defzoom),
      minZoom: 1,
      maxZoom: 8,
    }),
  });
  const overlay = new Overlay({
    element: popup,
    positioning: "bottom-center",
    offset: [0, -12],
  });
  map.addOverlay(overlay);

  function keepPopupInView() {
    if (popup.hidden) {
      return;
    }
    // Use map pixels, rather than page bounds, to also support zoomed themes.
    map.renderSync();
    const size = map.getSize();
    const bounds = mapTarget.getBoundingClientRect();
    const scale = size[1] / bounds.height;
    const top = Math.max(0, -bounds.top * scale);
    const bottom = Math.min(size[1], (window.innerHeight - bounds.top) * scale);
    popup.style.setProperty("--popup-height", `${Math.max(0, bottom - top - 56)}px`);
    const position = overlay.getPosition();
    const pixel = map.getPixelFromCoordinate(position);
    const halfWidth = popup.offsetWidth / 2;
    const target = [
      Math.max(halfWidth + 16, Math.min(size[0] - halfWidth - 16, pixel[0])),
      Math.max(top + popup.offsetHeight + 28, Math.min(bottom - 16, pixel[1])),
    ];
    map.getView().centerOn(position, size, target);
  }

  function closePopup(restoreFocus = false) {
    popup.hidden = true;
    overlay.setPosition(undefined);
    highlightedFeature = null;
    redrawLayers();
    if (restoreFocus) {
      mapTarget.focus({ preventScroll: true });
    }
  }

  closeButton.addEventListener("click", () => closePopup(true), {
    signal: listeners.signal,
  });
  mapTarget.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !popup.hidden) {
      event.preventDefault();
      closePopup(true);
    }
  }, { signal: listeners.signal });

  const resizeObserver = new ResizeObserver(() => {
    map.updateSize();
    const [width, height] = map.getSize();
    popup.style.setProperty("--popup-width", `${Math.max(0, width - 32)}px`);
    popup.style.setProperty("--popup-height", `${Math.max(0, height - 56)}px`);
    keepPopupInView();
  });
  resizeObserver.observe(mapTarget);
  map.addControl(new FullScreen());
  map.addControl(
    new MousePosition({
      projection: "EPSG:4326",
      className: "satellite-passage__coordinates",
      placeholder: Drupal.t("Lon: --, Lat: --"),
      coordinateFormat: (coordinate) => {
        const [longitude, latitude] = coordinate;
        return Drupal.t("Lon: @longitude, Lat: @latitude", {
          "@longitude": longitude.toFixed(2),
          "@latitude": latitude.toFixed(2),
        });
      },
    }),
  );

  for (const checkbox of root.querySelectorAll("[data-satellite-layer]")) {
    checkbox.addEventListener(
      "change",
      () => {
        closePopup();
        layersById.get(checkbox.dataset.satelliteLayer)?.setVisible(checkbox.checked);
      },
      { signal: listeners.signal },
    );
  }

  function redrawLayers() {
    // External filter/highlight state is not tracked by the vector renderer.
    for (const layer of layers) {
      layer.changed();
    }
  }

  function updateTimeline() {
    if (pendingSatellites.size > 0) {
      return;
    }

    const times = layers.flatMap((layer) =>
      layer
        .getSource()
        .getFeatures()
        .map((feature) => feature.get("ObservationTimeStart")),
    );
    observationBounds = getObservationBounds(times);

    if (!observationBounds) {
      updateStatus();
      return;
    }

    const initialStart = getInitialSliderValue(new Date(), observationBounds);
    startSlider.value = String(initialStart ?? 0);
    endSlider.value = "100";
    startSlider.disabled = false;
    endSlider.disabled = false;
    updateDateOutputs();
    redrawLayers();
    updateStatus();
  }

  function updateStatus() {
    if (failedSatellites.size > 0) {
      status.textContent = Drupal.t(
        "Could not load acquisition data for @satellites. Check that the corresponding files exist in the public KML directory.",
        { "@satellites": Array.from(failedSatellites).join(", ") },
      );
    } else if (!observationBounds) {
      status.textContent = Drupal.t(
        "No valid acquisition times were found in the KML files.",
      );
    } else {
      status.textContent = "";
    }
  }

  function updateDateOutputs() {
    startOutput.textContent = formatDate(
      sliderValueToDate(startSlider.value, observationBounds),
    );
    endOutput.textContent = formatDate(
      sliderValueToDate(endSlider.value, observationBounds),
    );
  }

  function updateRange(changedSlider) {
    if (changedSlider === startSlider && Number(startSlider.value) > Number(endSlider.value)) {
      endSlider.value = startSlider.value;
    }
    if (changedSlider === endSlider && Number(endSlider.value) < Number(startSlider.value)) {
      startSlider.value = endSlider.value;
    }

    updateDateOutputs();
    closePopup();
  }

  startSlider.addEventListener("input", () => updateRange(startSlider), {
    signal: listeners.signal,
  });
  endSlider.addEventListener("input", () => updateRange(endSlider), {
    signal: listeners.signal,
  });

  map.on("pointermove", (event) => {
    if (event.dragging) {
      return;
    }

    const feature = map.forEachFeatureAtPixel(event.pixel, (candidate) => candidate);
    const highlighted = feature ?? null;
    if (highlighted !== highlightedFeature) {
      highlightedFeature = highlighted;
      redrawLayers();
    }
  });

  map.on("click", (event) => {
    const selected = map.forEachFeatureAtPixel(event.pixel, (feature, layer) => ({
      feature,
      layer,
    }));
    if (!selected) {
      closePopup();
      return;
    }

    highlightedFeature = selected.feature;
    const satellite = SATELLITES.find(
      (candidate) => candidate.id === selected.layer.get("satelliteId"),
    );
    if (satellite) {
      addDetails(details, selected.feature, satellite);
      popupTitle.textContent = Drupal.t("@satellite acquisition", {
        "@satellite": satellite.label,
      });
      popup.hidden = false;
      overlay.setPosition(event.coordinate);
      keepPopupInView();
      closeButton.focus({ preventScroll: true });
    }
    redrawLayers();
  });

  return {
    dispose() {
      listeners.abort();
      resizeObserver.disconnect();
      map.dispose();
    },
  };
}

const drupal = window.Drupal;
const once = window.once;

drupal.behaviors.satellitePassage = {
  attach(context) {
    once("satellite-passage-map", "[data-satellite-passage]", context).forEach(
      (root) => {
        instances.set(root, initializeMap(root, window.drupalSettings.satellite_passage));
      },
    );
  },

  detach(context, settings, trigger) {
    if (trigger !== "unload") {
      return;
    }

    once
      .remove("satellite-passage-map", "[data-satellite-passage]", context)
      .forEach((root) => {
        instances.get(root)?.dispose();
        instances.delete(root);
      });
  },
};
