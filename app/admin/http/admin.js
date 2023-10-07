import { DrawPageWithBody } from '../../lib/http/util-request.js';
import fecha from 'fecha'
import fs from 'fs'

const ONE_DAY = 1000*60*60*24*1
export default class AdminMW {
  constructor(database, model) {
    this._database = database; // TODO: replace with implementation object
    this._model = model;
  }

  async respond(req, res, ctx) {
    try {
      if(req.url == "/admin") {
        req.url = "/create-slots-form.html"
        return false;

      } else if (req.url == "/slots") {
        req.url = "/crete-slots-form-success.html"
        return false;
      }
      return false;
    } catch (error) {
      console.error(error);
      res.end(DrawPageWithBody(`<p>There was an error: ${error}</p>`, ctx));
      return true;
    }
  }
  // TODO: reject bad input
  async handleSlots(req, res, ctx) {
    const form_obj = slots_parse(ctx.body);
    await this._model.createSlots([form_obj.range_start, form_obj.range_end]);
  }
}

/*
  validate form or fill with defualt values where needed
*/
export function slots_parse(_form_data) {
  let form_data = validate(_form_data);

  // parse dates
  // TODO not taking weekdays into account
  const range_start = fecha.parse(form_data["range-start"], "YYYY-MM-DD");
  const range_end = fecha.parse(form_data["range-end"], "YYYY-MM-DD");
  const time_start = fecha.parse(form_data["time-start"], "HH:mm");
  const time_end = fecha.parse(form_data["time-end"], "HH:mm");
  const interval = parseInt(form_data["duration"]);

  return {range_start, range_end, time_start, time_end, interval};  
}

function validate(form_data) {
  //let object = {"weekday-mo": "on", "range-start":  "2001-01-01", "range-end": "2001-01-01"};
  let properties = Object.getOwnPropertyNames(form_data);

  // take out checkbox data
  properties = properties.filter(p => !p.match('weekday')); 

  // replace invalid values with default values
  properties.map(p => {
    form_data[p] = ((!form_data[p]) || form_data[p] == '') 
    ? _default(p) 
    : form_data[p];
  })
  return form_data;
}

/*
  Throws if property is not expected, including weekdays
*/
function _default(property) {
  // more nuanced default value handling:
  if(["range-start","range-end"].includes(property)) {
    let now = new Date();
    now.setTime(now.getTime() + ONE_DAY);
    return fecha.format(now, "YYYY-MM-DD");
  } else if(["time-start", "time-end"].includes(property)) {
    return "13:00";
  } else if(property == "duration") {
    return "60";
  } else {
    throw Error("Unexpected property!");
  }
}

