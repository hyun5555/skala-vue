import assert from 'node:assert/strict'
import test from 'node:test'
import { createLocationId, parseLocationId } from '../server-utils.js'

test('국내 동적 지역 ID는 상세 조회용 좌표를 안전하게 복원한다', () => {
  const location = { name: '강남구', lat: 37.5177, lon: 127.0473 }
  const id = createLocationId(location)

  assert.deepEqual(parseLocationId(id), { id, ...location })
  assert.equal(parseLocationId(createLocationId({ name: '런던', lat: 51.5, lon: -0.1 })), null)
  assert.equal(parseLocationId('geo_invalid'), null)
})

test('과도하게 긴 ID, 잘못된 타입, 제어문자와 잘못된 좌표는 거절한다', () => {
  for (const id of [null, undefined, 123, {}, 'geo_' + 'A'.repeat(513), 'geo_e30=']) {
    assert.equal(parseLocationId(id), null)
  }
  for (const location of [
    { name: ' ', lat: 37.5, lon: 127 },
    { name: '서울\n', lat: 37.5, lon: 127 },
    { name: '가'.repeat(61), lat: 37.5, lon: 127 },
    { name: '서울', lat: '37.5', lon: 127 },
    { name: '서울', lat: 37.5, lon: null },
  ]) {
    assert.equal(parseLocationId(createLocationId(location)), null)
  }
})
