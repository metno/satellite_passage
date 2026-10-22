export function parseObservationTime(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const time = value.trim();
  // ESA KML timestamps without an explicit offset are UTC, not browser-local.
  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(time)
    ? `${time}Z`
    : time;
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
}

export function getObservationBounds(values) {
  const timestamps = values
    .map(parseObservationTime)
    .filter(Boolean)
    .map((date) => date.getTime());

  if (timestamps.length === 0) {
    return null;
  }

  return {
    min: new Date(Math.min(...timestamps)),
    max: new Date(Math.max(...timestamps)),
  };
}

export function sliderValueToDate(value, bounds) {
  if (!bounds) {
    return null;
  }

  const position = Math.min(100, Math.max(0, Number(value))) / 100;
  const timestamp =
    bounds.min.getTime() +
    position * (bounds.max.getTime() - bounds.min.getTime());
  return new Date(timestamp);
}

export function getInitialSliderValue(now, bounds) {
  if (!bounds) {
    return null;
  }

  const duration = bounds.max.getTime() - bounds.min.getTime();
  if (duration <= 0) {
    return 0;
  }

  const position = ((now.getTime() - bounds.min.getTime()) / duration) * 100;
  return Math.min(100, Math.max(0, position));
}

export function isInDateRange(value, start, end) {
  const observation = parseObservationTime(value);
  if (!observation || !start || !end) {
    return false;
  }

  return observation >= start && observation <= end;
}
