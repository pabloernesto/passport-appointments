import sqlite3 from 'sqlite3';
// TODO: 'userobj' is the same as the form in index.html

class DatabaseWrapper {
  constructor(db) {
    this.db = db;
  }

  // real db init could fail or take a long time.
  // for a discussion of async constructors see https://dev.to/somedood/the-proper-way-to-write-async-constructors-in-javascript-1o8c
  static fromNewTestDB() {
    const db = new sqlite3.Database(':memory:');
    db.serialize(() => {
      db.run(`create table users (user_id primary key, email);`);
    });

    return new DatabaseWrapper(db);
  }

  addUser(userobj) {
    const query = "insert into users (user_id, email, salt, hash)"
      + " values (?, ?, ?, ?)";
    const { user_id, email, hash, salt } = userobj;
    return new Promise((resolve, reject) => {
      this.db.run(query, [ user_id, email, salt, hash ], (err, res) => {
        err
          ? reject(err)
          : resolve(res);
      });
    });
  }

  getUser(username) {
    const query = `select * from users where user_id = ?`;

    return new Promise((resolve, reject) => {
      this.db.get(query, [ username ], (err, row) => {
        err
          ? reject(err)
          : resolve(row);
      });
    });
  }

  // if first digit is 1, has appointment
  hasUser(userobj) {
    const query = "select count(*) as count from users where user_id = ?;";
    const { user_id } = userobj;
    return new Promise((resolve, reject) => {
      this.db.get(query, [ user_id ], (err, res) => {
        err
          ? reject(err)
          : resolve(res);
      });
    });
  }

  // takes a user that is known to exist
  // TEMP: if even, the user has an appointment
  async hasAppointment(userobj) {
    return (userobj.userid % 2 == 0);
  }

  fetchAppointment(userobj) {
    return "saturday the 14th";
  }

  createAppointment(userobj) {
    return "sunday the 15th";
  }
}
  
export const database = DatabaseWrapper.fromNewTestDB();
export default { database };
