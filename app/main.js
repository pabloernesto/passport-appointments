import Server from './lib/http/server.js';
import AuthenticationMW from './lib/http/auth.js';
import AppointmentsMW from './ui/http/appointment.js';
// import AdminMW from './admin/http/admin.js';

import DatabaseWrapper from './storage/sqlite3/store.js';
import Appointments from './model/appointments.js';

let store = DatabaseWrapper.fromNewTestDB();
let model = new Appointments(store);

let server = new Server();
server.add_middleware(new AuthenticationMW(model));
server.add_middleware(new AppointmentsMW(model));
// server.add_middleware(new AdminMW(model));
// server.add_middleware(new http404MW());  // ?
server.listen('127.0.0.1', 3000);
