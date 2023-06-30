import { database } from './database-wrapper.js';

test('create 3 appointments and check them', async () => {
    await database.addUser({
        user_id: "Superman",
        email: "superman@un.org",
        salt: "ABCD",
        hash: "EFGH"
    });

    await database.addUser({
    user_id: "Batman",
    email: "batman@bat_base.org",
    salt: "ABCD",
    hash: "EFGH"
    });
    
    await database.addUser({
    user_id: "Wonder Woman",
    email: "wonderwoman@un.org",
    salt: "ABCD",
    hash: "EFGH"
    });

    let user = await database.getUser("Wonder Woman");
      
    await database.createAppointment(user.user_id);
    let appt = await database.fetchAppointment(user.user_id)
    expect(appt.date).toBe("sunday the 15th");
});