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
      db.run(`CREATE TABLE users (user_id int NOT NULL, email varchar(255) UNIQUE, salt varchar(255), hash varchar(255), PRIMARY KEY (user_id));`);
      db.run(`CREATE TABLE appointments (pass_id int NOT NULL, date varchar(255), user_id int, FOREIGN KEY (user_id) REFERENCES users (user_id), PRIMARY KEY (pass_id));`);
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
          resolve(res);
        }
      });
    });
  }

  // takes a user that is known to exist
  async hasAppointment(user_id) {
    const query = "SELECT count(*) as count FROM appointments WHERE user_id = ?;";
    return new Promise((resolve, reject) => {
      this.db.run(query, [ user_id ], (err, res) => {
        if (err || !res) {
          err = err ?? new Error("No result");
          err.query = query;
          err.params = { user_id };
          reject(new Error("Failed to check appointment", { cause: err }));
        } else {
          resolve(res);
        }
      });
    });
  }

  fetchAppointment(userobj) {
    return "saturday the 14th";
  }

  createAppointment(userobj) {
    return "sunday the 15th";
  }
}
  
export const database = DatabaseWrapper.fromNewTestDB();
