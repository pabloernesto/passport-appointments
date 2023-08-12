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
    const date_obj = fecha.parse(slot_date, "YYYY-MM-DDTHH:mm");
    await this._model.createSlots([date_obj]);
  }
}


