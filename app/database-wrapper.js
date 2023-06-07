import sqlite3 from 'sqlite3';
// TODO: 'userobj' is the same as the form in index.html

class DatabaseWrapper {
  constructor() {
    this.db = new sqlite3.Database(':memory:');
    this.db.serialize(() => {
      this.db.run(`create table counters (
        name primary key,
        value
      );`)
      .run(`insert into counters (name, value)
        values ("accesses", 0)`)
  
      // create table 'users'
      .run(`CREATE TABLE users (user_id PRIMARY KEY, email)`);
    });
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
  
export const database = new DatabaseWrapper();
export default { database };
