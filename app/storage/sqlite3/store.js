import Database from 'better-sqlite3';
import { Val, Err } from '../../lib/maybe.js';
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

  async fetchAppointment(username) {
    const user = await this.getUser(username);
    if (!user.val)
      return Err(`${username} is not a user.`);

    const query = this.db.prepare(`select * from appointments where user = ?`);
    const row = query.get([ username ]);
    return (
      row ? Val({ "user": row.user, "date": row.date })
      : Val(undefined)
    );
  }

  async createAppointment(user, date) {
    if (!this.getUser(user).val)
      return Err(`${user} is not a user.`);

    if (!date)
      return Err('Bad date string.', { str: date });
    try {
      fecha.parse(date, 'YYYY-MM-DD HH:mm:ss');
    } catch (err) {
      return Err('Bad date string.', { str: date });
    }

    const query = "INSERT INTO appointments (date, user) VALUES (?, ?)";

    const insert = this.db.prepare(query);
    const info = insert.run([date, user]);
    return Val({ date: date, user: user });
  }


  async createAppointmentSlot(date) {
    // check the date is valid
    // fecha.parse() throws when the date string does not obey the format
    try {
      fecha.parse(date, 'YYYY-MM-DD HH:mm:ss');
    } catch (err) {
      return Err('Bad date string.', { str: date });
    }

    const query = this.db.prepare("INSERT INTO slots (date) VALUES (?)");
    query.run([ date ]);
    return Val({ "date": date });
  }

  // TODO: implement db taking date order into account
  async popNearestAppointmentSlot(date_threshold) {
    let params;
    let query;

    if (date_threshold) {
      try {
        fecha.parse(date_threshold, 'YYYY-MM-DD HH:mm:ss');
      } catch {
        return Err('Bad date string.', { str: date_threshold });
      }
      query = 'SELECT * FROM slots WHERE date > ? ORDER BY date ASC LIMIT 1';
      params = [ date_threshold ];

    } else {
      query = `SELECT * FROM slots ORDER BY date ASC LIMIT 1`;
      params = [ ];
    }

    const select = this.db.prepare(query);
    const rows = select.all(params);

    if (!rows) {
      return Err("Bad database outcome");

    } else if (!rows.length) {
      return Val(undefined);

    } else {
      // pop
      const query_delete = this.db.prepare('DELETE FROM slots WHERE slot_id = ?');
      query_delete.run([ rows[0].slot_id ])

      return Val(rows[0]);
    }
  }

  async totalSlotsLeft() {
    let params;
    let query;
    query = `SELECT COUNT(*) FROM slots`;
    params = [ ];
    const row = this.db.prepare(query).get();
    return Val(row["COUNT(*)"]);
  }

  // appointment queue
  // adds user id to the queue
  // TODO: make atomic
  async addUserToQueue(user) {
    let _in = await this.userIsInQueue(user);
    if (_in)
      return Err("User already in queue.");

    if (!await this.getUser(user).val)
      return Err(`${user} is not a user.`);
    
    // is empty?
    let count = await this.totalUsersInQueue();
    if (count.err)
      return Err("Bad database"); // TODO: explain this
    let order = count.val + 1;

    // insert with order
    // order is maintained bc were inserting at the end
    const insert = this.db.prepare(
      "INSERT INTO appt_queue (queue_order, user) values (?, ?)");
    const info = insert.run([order, user]);

    return Val(info);
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
    if (row) {
      query_delete.run(row.queue_id);
      query_update_delete.run(row.queue_order);
    }
    return Val(row?.user);
  }

  // TODO make atomic
  // https://stackoverflow.com/questions/2224951/return-the-nth-record-from-mysql-query
  async getPagedUsersInQueue() {
    const to_fetch = 50;
    const query_get = this.db.prepare(
      `select * from appt_queue 
      ORDER BY queue_id LIMIT ?;`);

    const entries = query_get.all(to_fetch);
    return Val(entries);
  }

  /*
  Not relevant until we implement "withdrawing from the queue"
  */
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
    if (row) {
      query_delete.run([ user ]);
      query_update_delete.run(row.queue_order);
    }
    return Val(row?.user);
  }
    // TODO make atomic
  // https://stackoverflow.com/questions/2224951/return-the-nth-record-from-mysql-query
  async userIsInQueue(user) {
    const query_get = this.db.prepare(`select * FROM appt_queue WHERE user = ?;`);
    const row = query_get.get([user]);
    return (!!row);
  }

  async totalUsersInQueue() {
    const query_get = this.db.prepare(`select COUNT(*) FROM appt_queue;`);
    const row = query_get.get();
    return Val(row["COUNT(*)"]);
  }
  
  async totalUsersAheadOf(user) {
    const query_ahead = this.db.prepare(`select * FROM appt_queue WHERE user = ?;`);
    const row = query_ahead.get(user);
    return Val(row.queue_order - 1);
  }
}