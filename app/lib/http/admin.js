import { formBody, HTMLWrap } from './util-request.js';
import fecha from 'fecha'
import fs from 'fs'

const slots_form = 'app/assets/create-slots-form.html'
const slots_form_s = 'app/assets/create-slots-form-success.html'
export default class AdminMW {
  constructor(database, model) {
    this._database = database; // TODO: replace with implementation object
    this._model = model;
  }

  async respond(req, res) {
    
    
    if(req.url == "/admin") {
      const fileContents = fs.readFileSync(slots_form).toString()
      res.end(HTMLWrap(fileContents));
      return true;
    } else if (req.url == "/slots") {
      const fileContents_s = fs.readFileSync(slots_form_s).toString()
      await this.handleSlots(req, res);
      res.end(HTMLWrap(fileContents_s));
      return true;
    }
    return false;
  }
  async handleSlots(req, res) {
    // TODO: formBody not reading properly
    const form = await formBody(req);
    const form_obj = slots_parse(form);
    await this._model.createSlots([form_obj.range_start]);
  }
}

/*
  validate form or fill with defualt values where needed
*/
export function slots_parse(form_data) {
  //let object = {"weekday-mo": "on", "range-start":  "2001-01-01", "range-end": "2001-01-01"};
  let properties = Object.getOwnPropertyNames(form_data);

  // other than the checkbox data...
  properties = properties.filter(p => !p.match('weekday')); 

  // every property must have a value
  let  valid = properties.every(p => form_data[p] &&  (form_data[p] != ''));
  if(!valid) {
    properties.map(p => {
      form_data[p] = (form_data[p] == '') ? valid(p) : form_data[p];
    })
  }

  // parse dates
  const range_start = fecha.parse(form_data["range-start"], "YYYY-MM-DD");
  const range_end = fecha.parse(form_data["range-end"], "YYYY-MM-DD");
  const time_start = fecha.parse(form_data["time-start"], "HH:mm");
  const time_end = fecha.parse(form_data["time-end"], "HH:mm");
  const interval = parseInt(form_data["duration"]);

  return {range_start, range_end, time_start, time_end, interval};  
}

function valid(property) {
  if (["range-start", "range-end", "time-start", "time-end"].includes(property)) {
    return new Date(Date.now());
  }
}

