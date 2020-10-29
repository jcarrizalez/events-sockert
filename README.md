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

