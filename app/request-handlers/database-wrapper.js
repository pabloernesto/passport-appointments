
import sqlite3 from 'sqlite3';
// TODO: 'userobj' is the same as the form in index.html

function WrapperDatabase() {
    this.db = new sqlite3.Database(':memory:');

    /* split table creation/initialization and run inside serialize to prevent
    insertions from encountering a missing table */
    this.db.serialize(() => {
        this.db.run(`create table counters (
        name primary key,
        value
        );`)
        .run(`insert into counters (name, value)
        values ("accesses", 0);`)


        // create table 'users'

        .run(`create table users (
        user_id primary key,
        email
        );`);
    });

    this.addUser = function(userobj) {
        this.db.serialize(() => {
            this.db.run(`insert into users (user_id, email)
            values (${userobj.userid}, ${userobj.email});`
            );
        });
    },

    // if first digit is 1, has appointment
    this.hasUser = function(userobj) {
        return this.db.serialize(() => {
            this.db.get(`select (${userobj.userid}, ${userobj.email}) from users;`, (err, row) => {
                return (row != undefined);
            });
        })
    },

    // if even, it has an appointment
    this.hasAppointment = function(userobj) {
        return this.hasUser(userobj) && (userobj.userid % 2 == 0);
    },

    this.fetchAppointment = function(userobj) {
        return "saturday the 14th";
    },

    this.createAppointment = function(userobj) {
        return "sunday the 15th"
    }

};
    
export const database = new WrapperDatabase();

export default  { database }