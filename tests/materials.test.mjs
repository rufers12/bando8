import assert from 'node:assert/strict';
import test from 'node:test';
import snapshot from '../src/data/sheet.json' with {type: 'json'};
import extras from '../src/data/extras.json' with {type: 'json'};
import {amount, materialDetails, summarize} from '../src/materials.mjs';

test('시트 스냅샷에 필름을 제외한 26개 자재와 변경된 거실 욕실 환풍기가 들어 있다', () => {
  assert.equal(snapshot.items.length, 26);
  assert.equal(new Set(snapshot.items.map(item => item.id)).size, 26);
  assert.equal(snapshot.items.filter(item => item.url).length, 24);
  assert.ok(!snapshot.items.some(item => item.id === 'rooms-film'));
  // 결정 반영 후 추가 정보가 '재확인 필요'로 숨겨지지 않아야 한다
  for (const item of snapshot.items) assert.equal(extras[item.id]?.sourceSpec, item.spec, item.id);
  const fan = snapshot.items.find(item => item.id === 'hall-fan');
  assert.match(fan.spec, /HV3-80X\(MD-N\)/);
  assert.equal(amount(fan.price.min, fan.price.max), '95,000원');
  assert.deepEqual(summarize(snapshot.items), {min: 4355000, max: 5455000, priced: 22, unpriced: 4});
  assert.deepEqual(summarize(snapshot.items.filter(item => item.room === '거실 욕실')),
    {min: 1475000, max: 1825000, priced: 10, unpriced: 0});
});

test('행 순서가 달라도 제품 정보가 유지되고 모델이 바뀌면 기존 링크를 숨긴다', () => {
  const product = snapshot.items.find(item => item.id === 'kitchen-faucet');
  assert.equal(materialDetails({...product, row: 30}, extras), extras[product.id]);
  assert.deepEqual(materialDetails({...product, spec: '새 모델'}, extras).links, []);
});
