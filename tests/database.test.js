import Store from '../app/storage/sqlite3/store';

test('create 3 users and 1 appointment', async () => {
    let database = Store.fromNewTestDB()
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
    expect(appt.date).toBe("sunday the 1th");
});

test('create 3 appointments', async () => {
    let database = Store.fromNewTestDB()
    let pending_users = [];
    pending_users +=  database.addUser({
        user_id: "Superman",
        email: "superman@un.org",
        salt: "ABCD",
        hash: "EFGH"
    });

    pending_users += database.addUser({
    user_id: "Batman",
    email: "batman@bat_base.org",
    salt: "ABCD",
    hash: "EFGH"
    });
    
    pending_users += database.addUser({
    user_id: "Wonder Woman",
    email: "wonderwoman@un.org",
    salt: "ABCD",
    hash: "EFGH"
    });

    await Promise.all(pending_users);
    
    let user = await database.getUser("Wonder Woman");
    await database.createAppointment(user.user_id);
    let appt = await database.fetchAppointment(user.user_id)
    expect(appt.date).toBe("sunday the 1th");

    user = await database.getUser("Batman");
    await database.createAppointment(user.user_id);
    appt = await database.fetchAppointment(user.user_id)
    expect(appt.date).toBe("sunday the 2th");

    user = await database.getUser("Superman");
    await database.createAppointment(user.user_id);
    appt = await database.fetchAppointment(user.user_id)
    expect(appt.date).toBe("sunday the 3th");
});