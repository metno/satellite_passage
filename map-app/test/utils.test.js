import assert from "node:assert/strict";
import test from "node:test";

import {
  getInitialSliderValue,
  getObservationBounds,
  isInDateRange,
  parseObservationTime,
  sliderValueToDate,
} from "../utils.js";

test("observation bounds ignore invalid values", () => {
  const bounds = getObservationBounds([
    "2026-10-20T08:00:00Z",
    "not-a-date",
    "2026-10-22T08:00:00Z",
  ]);

  assert.equal(bounds.min.toISOString(), "2026-10-20T08:00:00.000Z");
  assert.equal(bounds.max.toISOString(), "2026-10-22T08:00:00.000Z");
  assert.equal(getObservationBounds(["", "invalid"]), null);
});

test("slider positions map to the bounded acquisition period", () => {
  const bounds = getObservationBounds([
    "2026-10-20T00:00:00Z",
    "2026-10-22T00:00:00Z",
  ]);

  assert.equal(
    sliderValueToDate(50, bounds).toISOString(),
    "2026-10-21T00:00:00.000Z",
  );
  assert.equal(sliderValueToDate(-5, bounds).toISOString(), bounds.min.toISOString());
  assert.equal(sliderValueToDate(105, bounds).toISOString(), bounds.max.toISOString());
});

test("initial slider position is clamped to the available dates", () => {
  const bounds = getObservationBounds([
    "2026-10-20T00:00:00Z",
    "2026-10-22T00:00:00Z",
  ]);

  assert.equal(
    getInitialSliderValue(new Date("2026-10-21T00:00:00Z"), bounds),
    50,
  );
  assert.equal(getInitialSliderValue(new Date("2026-10-25T00:00:00Z"), bounds), 100);
  assert.equal(getInitialSliderValue(new Date("2026-10-19T00:00:00Z"), bounds), 0);
  assert.equal(getInitialSliderValue(new Date(), null), null);
});

test("observation times with timezone offsets are compared in UTC", () => {
  assert.equal(
    parseObservationTime("2026-10-21T10:30:00+02:00").toISOString(),
    "2026-10-21T08:30:00.000Z",
  );
  for (const value of [null, undefined, 42, "", " ", "invalid"]) {
    assert.equal(parseObservationTime(value), null);
  }
});

test("ESA timestamps without offsets are UTC in a non-UTC browser timezone", (t) => {
  const timezone = process.env.TZ;
  process.env.TZ = "Europe/Oslo";
  t.after(() => {
    if (timezone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = timezone;
    }
  });

  assert.equal(
    parseObservationTime("2026-10-16T10:50:50.822").toISOString(),
    "2026-10-16T10:50:50.822Z",
  );
  assert.equal(
    parseObservationTime("2026-12-16T10:50:50").toISOString(),
    "2026-12-16T10:50:50.000Z",
  );
});

test("empty and single-time acquisition plans have stable slider bounds", () => {
  assert.equal(getObservationBounds([]), null);
  assert.equal(sliderValueToDate(50, null), null);
  const bounds = getObservationBounds(["2026-10-21T08:00:00Z"]);
  assert.equal(getInitialSliderValue(new Date(), bounds), 0);
  assert.equal(sliderValueToDate(50, bounds).toISOString(), bounds.min.toISOString());
  assert.equal(isInDateRange("2026-10-21T08:00:00Z", bounds.min, bounds.max), true);
});

test("fractional slider positions preserve the initial observation time", () => {
  const bounds = getObservationBounds([
    "2026-06-25T12:30:00Z",
    "2026-11-08T15:44:00Z",
  ]);
  const now = new Date("2026-10-21T08:30:00Z");
  const position = getInitialSliderValue(now, bounds);
  assert.equal(sliderValueToDate(position, bounds).getTime(), now.getTime());
});

test("date filtering includes range boundaries and excludes invalid timestamps", () => {
  const start = new Date("2026-10-20T00:00:00Z");
  const end = new Date("2026-10-22T00:00:00Z");

  assert.equal(isInDateRange("2026-10-20T00:00:00Z", start, end), true);
  assert.equal(isInDateRange("2026-10-22T00:00:00Z", start, end), true);
  assert.equal(isInDateRange("2026-10-23T00:00:00Z", start, end), false);
  assert.equal(isInDateRange("invalid", start, end), false);
});
