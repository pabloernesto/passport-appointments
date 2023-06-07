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

    return DatabaseWrapper(db);
  }

  addUser(userobj) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(
          `insert into users (user_id, email) values (?, ?)`,
          ["user_id", "email"],
          (err, res) => {
            if (err !== undefined)
              reject(err)
            else
              resolve(res);
          }
        );
      });
    });
  }

  // if first digit is 1, has appointment
  hasUser(userobj) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.get(
          `SELECT (?, ?) FROM users`,
          "user_id", "email",
          (err, row) => {
            if (err !== undefined)
              reject(err)
            else
              resolve(row !== undefined);
          }
        );
      })
    })
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
