import Database from 'better-sqlite3';
//https://stackoverflow.com/questions/5129624/convert-js-date-time-to-mysql-datetime
// TODO: 'userobj' is the same as the form in index.html

import fecha from 'fecha'
export default class DatabaseWrapper {
  constructor(db) {
    this.db = db;
  }

  // real db init could fail or take a long time.
  // for a discussion of async constructors see https://dev.to/somedood/the-proper-way-to-write-async-constructors-in-javascript-1o8c
  static fromNewTestDB() {
    this.db = Database(':memory:');
    const createUsers = this.db.prepare(`CREATE TABLE users (
      user_id INT NOT NULL, 
      email varchar(255) UNIQUE, 
      salt varchar(255), 
      hash varchar(255),
      role varchar(255) NOT NULL,
      PRIMARY KEY (user_id));`);
    const createAppts = this.db.prepare(`CREATE TABLE appointments (
      pass_id INTEGER PRIMARY KEY NOT NULL, 
      date varchar(255), 
      user_id INT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (user_id));`);
    const createSlots = this.db.prepare(`CREATE TABLE slots (
      slot_id INTEGER PRIMARY KEY NOT NULL, 
      date varchar(255));`);
    const createQueue = this.db.prepare(`CREATE TABLE appt_queue (
      queue_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL DEFAULT 0,
      user_id INTEGER, 
      FOREIGN KEY (user_id) REFERENCES users (user_id));`);

    const insertTables = this.db.transaction(() => {
      createUsers.run();
      createAppts.run();
      createSlots.run();
      createQueue.run();
    });
    insertTables();
    return new DatabaseWrapper(this.db);
  }

  addUserWithRole(user, email, hash, salt, role) {
    const query = "insert into users (user_id, email, salt, hash, role)"
      + " values (?, ?, ?, ?, ?)";
    const insert = this.db.prepare(query);
    const info = insert.run([ user, email, salt, hash, role]);
  }

  addUser(user, email, hash, salt) {
    return this.addUserWithRole(user, email, hash, salt, "u");
  }

  getUser(user) {
    const query = this.db.prepare(`select * from users where user_id = ?`);
    const row = query.get([ user ]);
    return row;
  }

  // if first digit is 1, has appointment
  hasUser(userobj) {
    const query = this.db.prepare("select count(*) as count from users where user_id = ?;");
    const { user_id } = userobj;
    const result = query.get([ user_id ]);
    return result.count > 0;
  }

  // takes a user that is known to exist
  // returns whether there is an appointment
  async hasAppointment(user_id) {
    const query =this.db.prepare( "SELECT count(*) as count FROM appointments WHERE user_id = ?;");
    const result = query.get([ user_id ]);
    return result.count > 0;
  }

  // structure: {pass_id, date, user_id}
  async fetchAppointment(user) {
    if(!this.getUser(user)) throw Error(`${user} is not a user.`);
    const query = this.db.prepare( `select * from appointments where user_id = ?`);
    const row = query.get([ user ]);
    return row ? {"user": row.user_id, "date": row.date} : undefined;
  }

  /**
   * Creates a new appointment for a given user with the provided date.
   *
   * @param {number} user - The user ID for whom the appointment will be created.
   * @param {string} date - The date of the appointment in 'YYYY-MM-DD HH:mm:ss' format.
   * @returns {Promise} A promise that resolves with the appointment parameters if successful.
   * @throws {Error} If there is an error during the database operation, the user ID is missing,
   *                 or the date provided is not in the correct format.
   */
  async createAppointment(user, date) {
    if(!this.getUser(user)) throw Error(`${user} is not a user.`);
    if(!date) throw Error(`Invalid date`);

    const query = "INSERT INTO appointments (date, user_id) VALUES (?, ?)";
    // check the date is valid
    // fecha.parse() throws when the date string does not obey the format
    fecha.parse(date, 'YYYY-MM-DD HH:mm:ss');


    const insert = this.db.prepare(query);
    const info = insert.run([date, user]);
    return {date: date, user: user};
  }


  async createAppointmentSlot(date) {
    const query = this.db.prepare("INSERT INTO slots (date) VALUES (?)");

    // check the date is valid
    // fecha.parse() throws when the date string does not obey the format
    fecha.parse(date, 'YYYY-MM-DD HH:mm:ss');
    query.run([date]);
    return {"date": date};
  }

  // TODO: implement sensibly
  async getNearestAppointmentSlot(date_threshold) {
    let params;
    let query;
    if(date_threshold) {
      query = `SELECT * FROM slots where date > ?`; // TODO:check that its after a certain date
      // check the date is valid
      // fecha.parse() throws when the date string does not obey the format
      fecha.parse(date_threshold, 'YYYY-MM-DD HH:mm:ss');
      params = [ date_threshold ];
    } else {
      query = `SELECT * FROM slots`; // TODO:check that its after a certain date
      params = [ ];
    }
    const select = this.db.prepare(query);
    const rows = select.all(params);
    if(!rows) throw Error("Bad database outcome");
    else if(rows.length) return(rows[0]);
    else return(undefined);
  }

  // appointment queue
  // adds user id to the queue
  // TODO: make atomic
  async addUserToQueue(user) {
    if(!this.getUser(user)) throw Error(`${user} is not a user.`);
    const insert = this.db.prepare(
      "INSERT INTO appt_queue (user_id) values (?)");
    const info = insert.run([user]);
    return info;
  }

  // TODO make atomic
  // https://stackoverflow.com/questions/2224951/return-the-nth-record-from-mysql-query
  async getFirstUserInQueue() {
    const query_get = this.db.prepare(`select * from appt_queue ORDER BY queue_id LIMIT 1;`);
    const query_delete = this.db.prepare(`DELETE FROM appt_queue WHERE queue_id = ?;`);


    const row = query_get.get();
    if(row) {
      query_delete.run(row.queue_id);
    }
    return row ? row.user_id : undefined;

  }
}