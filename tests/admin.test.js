import {slots_parse} from '../app/lib/http/admin'



/* Test context */
let auth;
let store;

beforeEach(async () => {
})



/* Tests */
test('result range start is not undefined', async () => {
  let result = slots_parse({"weekday-mo": "on", "range-start":  "2001-01-01", "range-end": "2001-01-01", "time-start":  "13:00", "time-end": "14:00"});
  expect(result.range_start).not.toEqual(undefined);
})
