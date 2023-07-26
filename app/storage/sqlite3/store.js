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
      db.run(`CREATE TABLE users (
        user_id INT NOT NULL, 
        email varchar(255) UNIQUE, 
        salt varchar(255), 
        hash varchar(255), 
        PRIMARY KEY (user_id));`);
      db.run(`CREATE TABLE appointments (
        pass_id INTEGER PRIMARY KEY NOT NULL, 
        date varchar(255), 
        user_id int, 
        FOREIGN KEY (user_id) REFERENCES users (user_id));`);
    });

    return new DatabaseWrapper(db);
  }

  addUser(user, email, hash, salt) {
    const query = "insert into users (user_id, email, salt, hash)"
      + " values (?, ?, ?, ?)";
    return new Promise((resolve, reject) => {
      this.db.run(query, [ user, email, salt, hash], (err, res) => {
        if (err) {
            err.query = query;
            err.params = { user_id: user, email, hash, salt };
            reject(new Error("Failed to add user", { cause: err }));
        } else {
          resolve(res);
        }
      });
    });
  }

  getUser(user) {
    const query = `select * from users where user_id = ?`;

    return new Promise((resolve, reject) => {
      this.db.get(query, [ user ], (err, row) => {
        if (err) {
          err.query = query;
          err.params = { user_id: username };
          reject(new Error("Failed to get user", { cause: err }));
        } else {
          resolve({
            user: row.user_id,
            email: row.email,
            hash: row.hash,
            salt: row.salt
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
  fetchAppointment(user_id) {
    const query = `select * from appointments where user_id = ?`;

    return new Promise((resolve, reject) => {
      this.db.get(query, [ user_id ], (err, row) => {
        if (err)
          reject(err);
        resolve({
          user: user_id,
          date: row.date,
        });
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
    if (!user)
      throw new Error("User ID must be provided.");

    const query = "INSERT INTO appointments (date, user_id) VALUES (?, ?)";

    // check the date is valid
    // fecha.parse() throws when the date string does not obey the format
    const dateobj = fecha.parse(date, 'YYYY-MM-DD HH:mm:ss');

    return new Promise((resolve, reject) => {
      this.db.run(query, [dateobj, user], (err, res) => {
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
}
