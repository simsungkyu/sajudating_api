import test from 'node:test';
import assert from 'node:assert/strict';

import { calculatePillars, toUnixTimestamp } from '../src/lib/ttyc.ts';
import { TTYC_COMPAT_MINUTE_CASES, TTYC_COMPAT_UNKNOWN_CASES } from '../src/lib/ttyc_sxtwl_compat_cases.ts';

const KST_OFFSET_MINUTES = 9 * 60;

test('ttyc minute precision matches sxtwl fixture cases', () => {
  for (const c of TTYC_COMPAT_MINUTE_CASES) {
    const ts = toUnixTimestamp(
      {
        year: c.year,
        month: c.month,
        day: c.day,
        hour: c.hour,
        minute: c.minute,
      },
      KST_OFFSET_MINUTES,
    );

    const got = calculatePillars({
      ts,
      tzOffsetMinutes: KST_OFFSET_MINUTES,
      timePrecision: 'MINUTE',
    });

    assert.equal(got.pillars.year.stem, c.yStem, `${c.name} year.stem`);
    assert.equal(got.pillars.year.branch, c.yBranch, `${c.name} year.branch`);
    assert.equal(got.pillars.month.stem, c.mStem, `${c.name} month.stem`);
    assert.equal(got.pillars.month.branch, c.mBranch, `${c.name} month.branch`);
    assert.equal(got.pillars.day.stem, c.dStem, `${c.name} day.stem`);
    assert.equal(got.pillars.day.branch, c.dBranch, `${c.name} day.branch`);

    assert.ok(got.pillars.hour, `${c.name} hour should exist`);
    assert.equal(got.pillars.hour!.stem, c.hStem, `${c.name} hour.stem`);
    assert.equal(got.pillars.hour!.branch, c.hBranch, `${c.name} hour.branch`);
  }
});

test('ttyc unknown precision matches sxtwl fixture cases (no hour pillar)', () => {
  for (const c of TTYC_COMPAT_UNKNOWN_CASES) {
    const ts = toUnixTimestamp(
      {
        year: c.year,
        month: c.month,
        day: c.day,
        hour: c.hour,
        minute: c.minute,
      },
      KST_OFFSET_MINUTES,
    );

    const got = calculatePillars({
      ts,
      tzOffsetMinutes: KST_OFFSET_MINUTES,
      timePrecision: 'UNKNOWN',
    });

    assert.equal(got.pillars.year.stem, c.yStem, `${c.name} year.stem`);
    assert.equal(got.pillars.year.branch, c.yBranch, `${c.name} year.branch`);
    assert.equal(got.pillars.month.stem, c.mStem, `${c.name} month.stem`);
    assert.equal(got.pillars.month.branch, c.mBranch, `${c.name} month.branch`);
    assert.equal(got.pillars.day.stem, c.dStem, `${c.name} day.stem`);
    assert.equal(got.pillars.day.branch, c.dBranch, `${c.name} day.branch`);
    assert.equal(got.pillars.hour, undefined, `${c.name} hour should be undefined`);
  }
});
