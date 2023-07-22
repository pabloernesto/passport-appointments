import { Server, http404MW } from './lib/http/server.js';
import AuthenticationMW from './lib/http/auth.js';
import AppointmentsMW from './ui/http/appointments.js';
import AdminMW from './admin/http/admin.js';

import { DummyStore } from './storage/sqlite-store.js';
import SecureAppointments from 'model/appointments-secure.js';

let store = new DummyStore();
let model = new SecureAppointments(store);

let server = new Server();
server.add_middleware(new AuthenticationMW(model));
server.add_middleware(new AppointmentsMW(model));
// server.add_middleware(new AdminMW(model));
// server.add_middleware(new http404MW());  // ?
server.listen('127.0.0.1', 3000);
