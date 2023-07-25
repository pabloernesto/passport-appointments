import sqlite3 from 'sqlite3';
// TODO: 'userobj' is the same as the form in index.html

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

  addUser(userobj) {
    const query = "insert into users (user_id, email, salt, hash)"
      + " values (?, ?, ?, ?)";
    const { user_id, email, hash, salt } = userobj;
    return new Promise((resolve, reject) => {
      this.db.run(query, [ user_id, email, salt, hash], (err, res) => {
        if (err) {
            err.query = query;
            err.params = { user_id, email, hash, salt };
            reject(new Error("Failed to add user", { cause: err }));
        } else {
          resolve(res);
        }
      });
    });
  }

  getUser(username) {
    const query = `select * from users where user_id = ?`;

    return new Promise((resolve, reject) => {
      this.db.get(query, [ username ], (err, row) => {
        if (err) {
          err.query = query;
          err.params = { user_id: username };
          reject(new Error("Failed to get user", { cause: err }));
        } else {
          resolve(row);
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


  createAppointment(user_id) {
    /* 
      USER ID MUST EXIST. 
    */

      // note: uses appt_id auto increment
    const query = "INSERT INTO appointments (date, user_id)"
      + " values (?, ?)";

    // TODO: real date system
    const date = "sunday the 15th";

    return new Promise((resolve, reject) => {
      this.db.run(query, [date, user_id], (err, res) => {
        if (err) {
            err.query = query;
            err.params = {date, user_id};
            reject(new Error("Failed to add user", { cause: err }));
        } else {
          resolve(res);
        }
      });
    });
  }
}
