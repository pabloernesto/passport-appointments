import sqlite3 from 'sqlite3';
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
    const db = new sqlite3.Database(':memory:');
    db.serialize(() => {
      db.run("PRAGMA foreign_keys = ON");
      db.run(`CREATE TABLE users (
        user_id INT NOT NULL, 
        email varchar(255) UNIQUE, 
        salt varchar(255), 
        hash varchar(255),
        role varchar(255) NOT NULL,
        PRIMARY KEY (user_id));`);
        // TODO: rename pass_id
      db.run(`CREATE TABLE appointments (
        pass_id INTEGER PRIMARY KEY NOT NULL, 
        date varchar(255), 
        user_id INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (user_id));`);
      db.run(`CREATE TABLE slots (
        slot_id INTEGER PRIMARY KEY NOT NULL, 
        date varchar(255));`);

      // https://medium.com/datadenys/implementing-simple-job-queue-with-mysql-8-0-and-php-pdo-6023724ace99
      db.run(`CREATE TABLE appt_queue (
        queue_id SERIAL PRIMARY KEY,
        user_id INTEGER, 
        FOREIGN KEY (user_id) REFERENCES users (user_id));`);
    });

    return new DatabaseWrapper(db);
  }

  addUserWithRole(user, email, hash, salt, role) {
    const query = "insert into users (user_id, email, salt, hash, role)"
      + " values (?, ?, ?, ?, ?)";
    return new Promise((resolve, reject) => {
      this.db.run(query, [ user, email, salt, hash, role], (err, res) => {
        if (err) {
            err.query = query;
            err.params = { user_id: user, email, salt, hash, role};
            reject(new Error("Failed to add user", { cause: err }));
        } else {
          resolve(res);
        }
      });
    });
  }

  addUser(user, email, hash, salt) {
    return this.addUserWithRole(user, email, hash, salt, "u");
  }

  getUser(user) {
    const query = `select * from users where user_id = ?`;

    return new Promise((resolve, reject) => {
      this.db.get(query, [ user ], (err, row) => {
        if (err) {
          err.query = query;
          err.params = { user_id: user };
          reject(new Error("Failed to get user", { cause: err }));

        } else if (row === undefined) {
          reject(new Error(`${ user } is not a user.`))

        } else {
          resolve({
            user: row.user_id,
            email: row.email,
            hash: row.hash,
            salt: row.salt,
            role: row.role
          });
        }
      });
    });
  }

  // if first digit is 1, has appointment
  hasUser(userobj) {
    const query = "select count(*) as count from users where user_id = ?;";
    const { user_id } = userobj;
    return new Promise((resolve, reject) => {
      this.db.get(query, [ user_id ], (err, res) => {
        if (err) {
          err.query = query;
          err.params = { user_id };
          reject(new Error("Failed to check user existence", { cause: err }));
        } else {
          resolve(res.count > 0);
        }
      });
    });
  }

  // takes a user that is known to exist
  // returns whether there is an appointment
  async hasAppointment(user_id) {
    const query = "SELECT count(*) as count FROM appointments WHERE user_id = ?;";
    return new Promise((resolve, reject) => {
      this.db.get(query, [ user_id ], 
        (err, res) => {
        if(err || !res) {
          reject(err);
        } else {
          resolve(res.count != 0);
        }
      });
    });
  }

  // structure: {pass_id, date, user_id}
  async fetchAppointment(user) {
    // ensure that the user id exists
    await this.getUser(user);

    const query = `select * from appointments where user_id = ?`;

    return new Promise((resolve, reject) => {
      this.db.get(query, [ user ], (err, row) => {
        if (err) {
          reject(err);

        } else if (!row) {
          resolve(undefined);

        } else {
          resolve({
            user: user,
            date: row.date,
          });
        }
      });
    });
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
    // ensure that the user id exists
    await this.getUser(user);

    const query = "INSERT INTO appointments (date, user_id) VALUES (?, ?)";

    // check the date is valid
    // fecha.parse() throws when the date string does not obey the format
    fecha.parse(date, 'YYYY-MM-DD HH:mm:ss');

    return new Promise((resolve, reject) => {
      this.db.run(query, [date, user], (err, res) => {
        const params = { user, date };
        if (err) {
          err.query = query;
          err.params = params;
          reject(new Error("Failed to create appointment", { cause: err }));

        } else {
          resolve(params);
        }
      });
    });
  }


  async createAppointmentSlot(date) {
    const query = "INSERT INTO slots (date) VALUES (?)";

    // check the date is valid
    // fecha.parse() throws when the date string does not obey the format
    fecha.parse(date, 'YYYY-MM-DD HH:mm:ss');

    return new Promise((resolve, reject) => {
      this.db.run(query, [date], (err, res) => {
        const params = { date };
        if (err) {
          err.query = query;
          err.params = params;
          reject(new Error("Failed to create appointment", { cause: err }));

        } else {
          resolve(params);
        }
      });
    });
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

    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else if (!rows) {
          throw Error("Bad database outcome");
        } else {
          if(rows.length) resolve(rows[0]);
          resolve(undefined);
        }
      });
    });
  }

  // appointment queue
  // adds user id to the queue
  async addUserToQueue(user) {
    const query = "INSERT INTO appt_queue (user_id)"
      + " values (?)";

    // wrap in promise
    return new Promise((resolve, reject) => {
      // serialize every user insert
      this.db.run(query, [ user ], (err, res) => {
        if (err) {
          err.query = query;
          err.params = { user_id: user};
          reject(new Error("Failed to add to queue", { cause: err }));
        } else {
          resolve(res);
        }
      });
    });
  }
  // https://stackoverflow.com/questions/2224951/return-the-nth-record-from-mysql-query
  async getFirstUserInQueue(match) {
    const query = `select * from appt_queue ORDER BY queue_id LIMIT 0,1`;

    return new Promise((resolve, reject) => {
      this.db.get(query, [ ], (err, row) => {
        if (err) {
          err.query = query;
          err.params = { };
          reject(new Error("Failed to get user", { cause: err }));

        } else if (row === undefined) {
          reject(new Error(`${ user } is not a user.`))

        } else {
          resolve({
            user: row.user_id,
            email: row.email,
            hash: row.hash,
            salt: row.salt,
            role: row.role
          });
        }
      });
    });

  }
}