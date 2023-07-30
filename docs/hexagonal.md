# hexagonal

## Summary
The project is organized like this:

- There is a model folder, which contains the logic of the app, independent of implementation detail.
- For each port of the app, there is a folder for that port.
- For every adapter to a port, there is a subfolder in the port's folder, containing the code for that adapter.
- There is a 'lib' folder for code that is implementation detail but shared between adapters.
- main.js is the start point. Hooks up concrete runtime implementation of our code. (Which modules are on and off?)

## Translating hexagonal architecture into code
The hexagonal (ports and adapters) pattern stipulates that modules in a system are to be connected through interfaces known as ports.
A module implementing such an interface is called an adapter for that port.

![](hexagonal-architecture-example-cockburn-emergency.png)

This translates into modules represented as objects, connected through composition:

```
class Application {
  constructor(notifications_adapter, database_adapter) {
    this.notifications = notifications_adapter;
    this.database = database_adapter;
  }
}
```

In the example above, the trigger_data and administration ports are left ports (or driver ports).
So called because they are to the left of the image, they are not represented as the interfaces of objects passed into the application, but rather as the interface the application exposes to objects that receive it as a parameter.

```
class GUIAdministration {
  constructor(app) {
    this.app = app;
  }
}
```

The point of the separation is to allow the modules to be swapped out.
This structure has some obvious implications on project structure:

```
/
L lib/
L application/
L notifications/
  L answering_machine/
  L email/
  L mock_telephone/
L database/
  L DB/
  L mock_database/
L trigger_data/
  L wire_feed/
  L http_feed/
L administration/
  L GUI/
  L http/
  L app_to_app/
```

The interfaces in the system will...
Every implementation of the same port shares most of its interface with the others.
They will be depended on by the same code.
They will respond in the same way to tests (assuming that no errors are present).

EXPLAIN HOW INTERACTION WITH THE OUTSIDE WORLD IS THE CRITERION FOR NEW PORTS
