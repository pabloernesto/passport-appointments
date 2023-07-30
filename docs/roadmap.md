# Prototypes
## Part one
- Three views: homepage, request ID, display appointment
- Request ID: single numerical entry of exactly 8 digits, otherwise reject
- No interaction with database
- appointment generator does not handle concurrency, but it does take the ID as argument
- Appointment is some valid date and time

### Part one point five
- Database: store ID, appointment pairs in real database
