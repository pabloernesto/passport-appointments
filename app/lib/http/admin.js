import { formBody, HTMLWrap } from './util-request.js';
import fecha from 'fecha'

export default class AdminMW {
  constructor(database, model) {
    this._database = database; // TODO: replace with implementation object
    this._model = model;
  }

  async respond(req, res) {
    if(req.url == "/admin") {
      res.end(HTMLWrap(`
  <form method="POST" action="/single_slot">
    <label for="single_slot">Add single appointment slot (date and time):</label>
    <input type="datetime-local" id="single_slot" name="single_slot"> 
    <button>Add new slot</button>
  </form>`));
      return true;
    } else if (req.url == "/single_slot") {
      await this.handleSingleSlot(req, res);
      res.end(HTMLWrap(`
  <form method="POST" action="/single_slot">
    <label for="single_slot">Add single appointment slot (date and time):</label>
    <input type="datetime-local" id="single_slot" name="single_slot"> 
    <button>Add new slot</button>
    <label>Success!</label>
  </form>`));
      return true;
      
    }
    return false;
  }
  async handleSingleSlot(req, res) {
    const { single_slot: slot_date } = await formBody(req);
    const date_obj = fecha.parse(slot_date, "YYYY-MM-DDTHH:mm");
    await this._model.createSlots([date_obj]);
  }
}


