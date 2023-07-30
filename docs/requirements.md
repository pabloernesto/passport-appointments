# Requirements
The user can get an appointment at an embassy to request a passport.
If passport dates are available the system assigns the user an appointment immediately.
Because forcing people to rush would be bad, the system doesn't give out appointments less than one week (variable?) into the future.

If passport dates are not available, the user will be added to a queue, and assigned a date in order of arrival.

Appointments and queues are separate by embassy.

Users should be able to leave the queue or cancel their appointments.

Users should be able to see how many people are in the queue (in front of them and maybe behind?).
Counts should be precise to two significant figures.

As a safety mechanism, all actions will be confirmed through email.
When a user is assigned an appointment, they receive a confirmation mail.
When a user is queued up, they receive a confirmation mail.
When a user cancels their appointment, they receive a confirmation mail.
When a user leaves the queue, they receive a confirmation mail.

As a stretch goal:  
Users are able to declare a date-time preference (monday morning, tuesday afternoon, etc).
When a batch of appointments is released, the system will attempt to fulfill as many people's preferences as it can.
