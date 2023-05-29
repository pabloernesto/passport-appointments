export const database = {
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