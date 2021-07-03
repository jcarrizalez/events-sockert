# events-gateway

Eventos de la web o android a gateway, es una conexión socket donde se envían todo tipo de eventos para ser almacenados y usados  internamente para medición de datos

## SERVER-INSTALL
```bash
npm install;
```
## SERVER-CONFIG
```bash
nano .env;
  PORT=9015
  API_KEY=*************
  API_URL=*************
  API_SECRET=**********
  API_VERSION=*********
```
## SERVER-START
```bash
node server.js;
```
## CLIENT-FRONTEND
```bash
nano index.html;
  <head>
    <script console="false" src="https://events.stage.qubit.tv/?tracker=WEB-RDEWFQS"></script>
  </head>
  <body>
    <script>
      window.TrackerQb = event => (typeof TQb==='function')? TQb(event) : null;
    </script>
  </body>
```

## CLIENT-FRONTEND-EXAMPLE
```bash
  window.TrackerQb({
    type:'error_javascript',
    user_id: 123456,
    profile_id: 654321,
    path: '/inicio'
  });
```

## BACKOFFICE-FRONTEND
```bash
nano index.html;
  <head>
    <script console="true" src="https://events.stage.qubit.tv/?tracker=BAC-QDFGREE"></script>
  </head>
  <body>
    <script>
      window.TrackerQb = (typeof TQb==='object')? TQb : {};

      window.TrackerQb.on('backoffice-connections', function (message) {
        console.log('backoffice-connections',  message);
      });
      window.TrackerQb.on('backoffice-tracker', function (message) {
        console.log('backoffice-tracker', message);
      });
    </script>
  </body>
```
