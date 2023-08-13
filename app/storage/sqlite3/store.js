import Database from 'better-sqlite3';
import { Val, Err } from '../../lib/maybe';
// https://stackoverflow.com/questions/5129624/convert-js-date-time-to-mysql-datetime
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
      user INT NOT NULL,
      email varchar(255) UNIQUE,
      salt varchar(255),
      hash varchar(255),
      role varchar(255) NOT NULL,
      PRIMARY KEY (user));`);
    const createAppts = this.db.prepare(`CREATE TABLE appointments (
      pass_id INTEGER PRIMARY KEY NOT NULL,
      date varchar(255),
      user INT NOT NULL,
      FOREIGN KEY (user) REFERENCES users (user));`);
    const createSlots = this.db.prepare(`CREATE TABLE slots (
      slot_id INTEGER PRIMARY KEY NOT NULL,
      date varchar(255));`);
    const createQueue = this.db.prepare(`CREATE TABLE appt_queue (
      queue_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL DEFAULT 0,
      queue_order INTEGER,
      user INTEGER,
      FOREIGN KEY (user) REFERENCES users (user));`);

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
    const query = "insert into users (user, email, salt, hash, role)"
      + " values (?, ?, ?, ?, ?)";
    const insert = this.db.prepare(query);
    const info = insert.run([ user, email, salt, hash, role]);
    // TODO: no return, addUser() is buggy. better-sqlite3 is synchronous,
    //  so maybe this is fine?
  }

  addUser(user, email, hash, salt) {
    return this.addUserWithRole(user, email, hash, salt, "u");
  }

  getUser(user) {
    const query = this.db.prepare(`select * from users where user = ?`);
    const row = query.get([ user ]);
    return Val(row);
  }

  // if first digit is 1, has appointment
  hasUser(userobj) {
    const query = this.db.prepare("select count(*) as count from users where user = ?;");
    const result = query.get([ userobj.user_id ]);
    return result.count > 0;
  }

  // takes a user that is known to exist
  // returns whether there is an appointment
  async hasAppointment(user) {
    const query =this.db.prepare( "SELECT count(*) as count FROM appointments WHERE user = ?;");
    const result = query.get([ user ]);
    return result.count > 0;
  }

  // structure: {pass_id, date, user}
  async fetchAppointment(username) {
    const user = await this.getUser(username);
    if (!user.val)
      return Err(`${username} is not a user.`);

    const query = this.db.prepare(`select * from appointments where user = ?`);
    const row = query.get([ username ]);
    return row ? { "user": row.user, "date": row.date } : undefined;
  }

  async createAppointment(user, date) {
    if (!this.getUser(user).val)
      return Err(`${user} is not a user.`);

    if (!date)
      return Err(`Invalid date`);

    const query = "INSERT INTO appointments (date, user) VALUES (?, ?)";
    // check the date is valid
    // fecha.parse() throws when the date string does not obey the format
    fecha.parse(date, 'YYYY-MM-DD HH:mm:ss');

    const insert = this.db.prepare(query);
    const info = insert.run([date, user]);
    return Val({ date: date, user: user });
  }


  async createAppointmentSlot(date) {
    const query = this.db.prepare("INSERT INTO slots (date) VALUES (?)");

    // check the date is valid
    // fecha.parse() throws when the date string does not obey the format
    fecha.parse(date, 'YYYY-MM-DD HH:mm:ss');
    query.run([date]);
    return {"date": date};
  }

  // TODO: implement db taking date order into account
  async popNearestAppointmentSlot(date_threshold) {
    let params;
    let query;
    if(date_threshold) {
      query = `SELECT * FROM slots WHERE date > ? ORDER BY date ASC LIMIT 1`;
      // check the date is valid
      // fecha.parse() throws when the date string does not obey the format
      fecha.parse(date_threshold, 'YYYY-MM-DD HH:mm:ss');
      params = [ date_threshold ];
    } else {
      query = `SELECT * FROM slots ORDER BY date ASC LIMIT 1`;
      params = [ ];
    }
    const select = this.db.prepare(query);
    const rows = select.all(params);
    if(!rows) {
      throw Error("Bad database outcome");
    } else if(rows.length) {
      // pop
      const query_delete = this.db.prepare(
        `DELETE FROM slots WHERE slot_id = ?;`);
      query_delete.run([ rows[0].slot_id ])
      return rows[0];
    }else {
      return undefined;
    }
  }

  async totalSlotsLeft() {
    let params;
    let query;
    query = `SELECT COUNT(*) FROM slots`;
    params = [ ];
    const row = this.db.prepare(query).get();
    return (row["COUNT(*)"]);
  }

  // appointment queue
  // adds user id to the queue
  // TODO: make atomic
  async addUserToQueue(user) {
    let _in = await this._userIsInQueue(user);
    if(_in) throw Error("User already in queue.");

    if(!await this.getUser(user)) 
      throw Error(`${user} is not a user.`);
    
    // is empty?
    let count = await this.totalUsersInQueue();
    if(count == undefined) throw Error("Bad database");
    let order = count + 1;

    // insert with order
    const insert = this.db.prepare(
      "INSERT INTO appt_queue (queue_order, user) values (?, ?)");
    const info = insert.run([order, user]);

    // order is maintained bc were inserting at the end

    return info;
  }

  // TODO make atomic
  // https://stackoverflow.com/questions/2224951/return-the-nth-record-from-mysql-query
  async getFirstUserInQueue() {
    const query_get = this.db.prepare(
      `select * from appt_queue 
      ORDER BY queue_id LIMIT 1;`);
    const query_delete = this.db.prepare(
      `DELETE FROM appt_queue 
      WHERE queue_id = ?;`);

    // maintain ordering
    const query_update_delete = this.db.prepare(
      `UPDATE appt_queue 
      SET queue_order = queue_order - 1 
      WHERE queue_order >= ?;`);
    
    const row = query_get.get();
    if(row) {
      query_delete.run(row.queue_id);
      query_update_delete.run(row.queue_order);
    }
    return row ? row.user : undefined;
  }

  async removeUserFromQueue(user) {
    const query_get = this.db.prepare(
      `select * from appt_queue 
      WHERE user = ?;`);

    const query_delete = this.db.prepare(
      `DELETE FROM appt_queue 
      WHERE user = ?;`);

    // maintain ordering
    const query_update_delete = this.db.prepare(
      `UPDATE appt_queue 
      SET queue_order = queue_order - 1 
      WHERE queue_order >= ?;`);
    
    const row = query_get.get([ user ]);
    if(row) {
      query_delete.run([ user ]);
      query_update_delete.run(row.queue_order);
    }
    return row ? row.user : undefined;
  }
    // TODO make atomic
  // https://stackoverflow.com/questions/2224951/return-the-nth-record-from-mysql-query
  async _userIsInQueue(user) {
    const query_get = this.db.prepare(`select * FROM appt_queue WHERE user = ?;`);
    const row = query_get.get([user]);
    return (!!row);
  }

  async totalUsersInQueue() {
    const query_get = this.db.prepare(`select COUNT(*) FROM appt_queue;`);
    const row = query_get.get();
    return (row["COUNT(*)"]);
  }
  
  async totalUsersAheadOf(user) {
    const query_ahead = this.db.prepare(`select * FROM appt_queue WHERE user = ?;`);
    const row = query_ahead.get(user);
    return row.queue_order - 1;
  }
}