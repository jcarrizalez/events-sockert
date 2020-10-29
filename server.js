const fs = require('fs');
const url = require('url');
const http = require('http');
const dotenv = require('dotenv');
const request = require('request');

dotenv.config();

['PORT', 'API_KEY', 'API_URL', 'API_SECRET', 'API_VERSION'].forEach( (item, key ) => {
    if(process.env[item]===undefined){
        throw new Error(`{item} at .env is require`);
    } 
});

var api = {
    url: process.env.API_URL,
    token:null,
    credentials:{ 
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET,
        api_version: process.env.API_VERSION
    }
};

var state_clients = [];

var state_agents = [];

var state_origins = [];

var state_socket_ids = {};

var state_tracker = {
    column:['type', 'socket_id', 'ip', 'agent_id', 'origin_id', 'message', 'date', 'read'],
    rows:[]
};
var register_tracker = {
    column:['type', 'socket_id', 'ip', 'agent_id', 'origin_id', 'message', 'date'],
    rows:[]
};

const limit = 100;

// Loading displayed to the client
var server = http.createServer(function(req, res) {
    if(req.url === "/live") {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(live_data()));
        return;
    }
    else if(req.url.indexOf('/?tracker')!==-1){
        const queryObject = url.parse(req.url,true).query;
        fs.readFile('./services.js', 'utf-8', function(error, content) {
            res.writeHead(200, {"Content-Type": "text/html"});
            if (content.indexOf(queryObject.tracker || 'no-existe-tracker')===-1) res.end('NOT AUTHORIZED!!!');
            else res.end(content);
        });
    }
});

// Loading socket.io
var io = require('socket.io').listen(server);

const timestamp = () => new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

const catn_connections = () => io.engine.clientsCount;

const tracker = (socket, message) => {
    if(typeof message !== 'object') return null;
    else if (message.type===undefined) return null;
    const type = message.type;
    delete message.type;
    var date = timestamp();
    var client = state_socket_ids['socket'+socket.id];
    state_tracker.rows.push([type, socket.id, client.address, client.agent_id, client.origin_id, message, date, false ]);
    live_data('socket', type, socket);
}

const connections = {
    push: socket => {
        const { id, handshake } = socket;
        var agent = handshake.headers['user-agent'] || 'no-definido';
        var address = handshake.headers['x-forwarded-for'] || handshake.address || 'no-definido';
        var origin = handshake.headers.origin;

        var agent_id = state_agents.find(item => item.name===agent);
        var origin_id = state_origins.find(item => item.name===origin);

        if(agent_id===undefined){
            state_agents.push({id:'A'+timestamp().replace(/[^\d,]+/g, '')+state_agents.length, name:agent});
            agent_id = state_agents.find(item => item.name===agent);
        }
        agent_id = agent_id.id;

        if(origin_id===undefined){
            state_origins.push({id:'O'+timestamp().replace(/[^\d,]+/g, '')+state_origins.length, name:origin});
            origin_id = state_origins.find(item => item.name===origin);
        }
        origin_id = origin_id.id;


        state_socket_ids['socket'+id] = {
            agent_id,
            origin_id,
            address
        };

        var find = state_clients.find(item => item.address===address);
        if(find){
            find.sockets.push({id, agent_id, origin_id});
            var clients = state_clients.filter(item => item.address!==address);
            clients.push(find);
            state_clients = clients;
        }
        else {
            state_clients.push({address, sockets:[{id, agent_id, origin_id}]});
        }
        tracker(socket, {type:'connection'});
    },
    remove: socket => {
        const { id, handshake } = socket;
        const address = handshake.address;
        var find = state_clients.find(item => item.address===address);
        if(find){
            var clients = state_clients.filter(item => item.address!==address);
            var filter_id = find.sockets.filter(item => item.id!==id);
            find.sockets = filter_id;
            if(find.sockets.length>0){
                clients.push(find);
            }
            state_clients = clients;
        }
        tracker(socket, {type:'disconnect'});
    }
};


io.sockets.on('connection', function (socket, key) {

    connections.push(socket);

    socket.on('disconnect', () => connections.remove(socket) );

    socket.on('tracker',  (message) => tracker(socket, message) ); 

});


function live_data(event, type='', socket ){

    const onConnections = () => {
        return {
            date:timestamp(),
            catn_connections:catn_connections(),
            catn_clients:state_clients.length,
            agents:state_agents,
            clients:state_clients
        };
    };
    const onTracker = () => {
        return {
            date:timestamp(),
            tracker:{
                column:state_tracker.column,
                rows:state_tracker.rows.slice(state_tracker.rows.length-limit).reverse(),
            }
        };
    };

    if(event==='socket'){
        if(type==='connection' || type==='disconnect' || type==='load'){
            socket.broadcast.emit('backoffice-connections', onConnections());
        }
        socket.broadcast.emit('backoffice-tracker', onTracker());
    }
    else{
        return {
            ...onConnections(),
            ...onTracker()
        }
    }
}

function check_data(){

    var agent_ids = [];
    var origin_ids = [];

    state_tracker.rows.forEach( (item, key ) => {
        agent_ids.push(item[3]);
        origin_ids.push(item[4]);
        if(item[7]===false){
            item[7] = true;
            state_tracker.rows[key] = item;
            register_tracker.rows.push([item[0],item[1], item[2], item[3], item[4], item[5] , item[6]]);
        } 
    });
    //DEBO TERMINAR ESTA PARTE BASICAME ES ELIMINAR CADA TIEMPO SI NO ESTA EN USO DE LOS ARRAY
    //agent_ids = Array.from(new Set(agent_ids));
    //state_agents = state_agents.map( item => (agent_ids.indexOf(item.id)!==-1)? item :null);
    //state_agents = state_agents.filter(item =>item!==null);
    
    var state_tracker_reverse = state_tracker.rows.slice(state_tracker.rows.length-limit).reverse();
    state_tracker.rows = state_tracker_reverse.filter((item, key)=>key<=limit).reverse();

    //Esto es para enviar la data
    if(register_tracker.rows.length>0){
        var register = {
            agents:state_agents,
            origins:state_origins,
            tracker:register_tracker,
        };
        api_post_auth(register); // <- este metodo llama al registro de evento si es true
    }
    setTimeout(() => check_data(), 10000);
}
check_data();

function api_post_auth(register){
    request({
        url: api.url+'/auth',
        method: "POST",
        json: true, 
        body: api.credentials
    }, function (error, response, body){
        if(body && body.status==='success'){
            api.token = body.data.token;
            api_post_events_register(register);
        }
        else{
            console.log('error');
        }
    });
}

function api_post_events_register(register){
    request({
        url: api.url+'/events-register',
        method: "POST",
        json: true, 
        body: register,
        headers: {
            Authorization:api.token
        }
    }, function (error, response, body){
        if(body && body.status==='success'){
            register_tracker.rows = [];
            console.log('data-register');
        }
        else{
           console.log('error');
        }
    });
}
server.listen(process.env.PORT);