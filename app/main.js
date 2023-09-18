import Server from './lib/http/server.js';
import FormBodyMW from './lib/http/formbody.js'
import http404MW from './lib/http/404.js';
import AuthenticationMW from './lib/http/auth.js';
import StaticFilesMW from './lib/http/static.js';
import RedirectMW from './lib/http/redirect.js';
import AppointmentsMW from './ui/http/appointment.js';
import HTMLComponentsMW from './lib/http/components.js';
import AdminMW from './lib/http/admin.js';

import DatabaseWrapper from './storage/sqlite3/store.js';
import Appointments from './model/appointments.js';

let store = DatabaseWrapper.fromNewTestDB();
let model = new Appointments(store);

let server = new Server();
server.add_middleware(new FormBodyMW());
server.add_middleware(await AuthenticationMW.fromDatabase(store));
server.add_middleware(new AppointmentsMW(model));
server.add_middleware(await RedirectMW.fromMap({"/": "/index"}));
server.add_middleware(await StaticFilesMW.fromPath("./app/assets/static"));
server.add_middleware(await HTMLComponentsMW.fromPath("./app/assets/html-components"));
server.add_middleware(new AdminMW(store, model));
server.add_middleware(new http404MW());
server.listen('127.0.0.1', 3000);
