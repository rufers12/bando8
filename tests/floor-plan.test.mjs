import assert from 'node:assert/strict';
import {test} from 'node:test';
import {fitToPlan, initialLayout, nextRotation, parseLayout, planHeight, serializeLayout, spaces} from '../src/floor-plan.mjs';

test('a moved and rotated layout round trips, with turns wrapping after 270 degrees', () => {
  const space = spaces[0];
  const placement = fitToPlan(space, {x: 0, y: planHeight, rotation: nextRotation(0), scale: 100});
  assert.deepEqual(placement, {x: 113, y: planHeight - 129, rotation: 90, scale: 100});
  const layout = {...initialLayout, [space.id]: placement};
  assert.deepEqual(parseLayout(serializeLayout(layout)), layout);
  assert.equal(nextRotation(270), 0);
});

test('rejects a backup with an unknown room, unsupported rotation, or off-canvas placement', () => {
  assert.throws(() => parseLayout(serializeLayout({...initialLayout, unknown: initialLayout.living})));
  assert.throws(() => parseLayout(serializeLayout({...initialLayout, living: {...initialLayout.living, rotation: 45}})));
  assert.throws(() => parseLayout(serializeLayout({...initialLayout, living: {...initialLayout.living, x: -1}})));
});
