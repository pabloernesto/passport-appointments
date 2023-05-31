
import sqlite3 from 'sqlite3';
export const database = {
    initialize() {
        const db = new sqlite3.Database(':memory:');

        /* split table creation/initialization and run inside serialize to prevent
        insertions from encountering a missing table */
        db.serialize(() => {
            db.run(`create table counters (
            name primary key,
            value
            );`)
            .run(`insert into counters (name, value)
            values ("accesses", 0);`)
            .run(`create table users (
            user_id primary key,
            passport int
            );`)
            .run(`insert into users (user_id, passport)
            values (69, 420);`
            );
        });
    
    },

    // if first digit is 1, has appointment
    hasUser(userobj) {
        return (userobj.userid >= 10000000) && (userobj.userid < 20000000);
    },

    // if even, it has an appointment
    hasAppointment(userobj) {
        return this.hasUser(userobj) && (userobj.userid % 2 == 0);
    },

    fetchAppointment(userobj) {
        return "saturday the 14th";
    },

    createAppointment(userobj) {
        return "sunday the 15th"
    },
}

export default  { database }