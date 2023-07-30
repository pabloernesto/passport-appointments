# hexagonal
The project is organized like this:

- There is a model folder, which contains the logic of the app, independent of implementation detail.
- For each port of the app, there is a folder for that port.
- For every adapter to a port, there is a subfolder in the port's folder, containing the code for that adapter.
- There is a 'lib' folder for code that is implementation detail but shared between adapters.
- main.js is the start point. Hooks up concrete runtime implementation of our code. (Which modules are on and off?)
