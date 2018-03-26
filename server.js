var express = require("express");
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var session = require("express-session");
var path = require('path');
mongoose.connect('mongodb://localhost/my_first_db');
var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(session({secret: 'ThisIsSecureForSure'}));

app.use(express.static(__dirname + "/AngularApp/dist"));

app.set('views', __dirname + "/views");
app.set('view engine', 'ejs');

var Schema = mongoose.Schema;
var UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        validate: {
            validator: function(value) {
                return /^[a-z0-9]+$/i.test(value);
            },
            message: 'Please only use alphanumeric characters in username'
        }
    },
    password : {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Passwords must be 8 or more characters"]
    },
    decks: {
        type: Array
    }
}, {timestamps: true});

mongoose.model('User', UserSchema);
var User = mongoose.model('User');

app.post("/users/register", function(req, res) {
    console.log("app.post '/users/register'");
    let newUser = new User({
        username: req.body.username,
        password: req.body.password,
        decks: []
    });
    User.findOne({username:req.body.username}, function(err, user) {
        if (user != null) {
            newUser.validate(function(err) {
                if (err) {
                    err['errors']['username'] = {message:"Try another username"}
                    res.json({message:"Fail", data:err});
                } else {
                    res.json({errors:{username:{message:"Try another username"}}})
                }
            });
        } else {
            newUser.validate(function(err) {
                if (err) {
                    res.json({message:"Fail", data:err});
                } else {
                    newUser.password = bcrypt.hashSync(newUser.password);
                    newUser.save(function(err) {
                        if (err) {
                            res.json({message:"Fail", data:err});
                        } else {
                            req.session._id = newUser._id;
                            res.json({message:"Success", data:newUser._id});
                        }
                    });
                }
            });
        }
    })
});
app.post("/users/login", function(req, res) {
    console.log ("app.post '/users/login'");
    console.log("req.body.username: " + req.body.username);
    User.findOne({username: req.body.username}, function(err, user) {
        console.log("Inside User.findOne()")
        if (user != null) {
            console.log("user != null");
            if (bcrypt.compareSync(req.body.password, user.password)) {
                req.session._id = user._id;
                res.json({message:"Success", data:user._id});
            } else {
                console.log("passwords do not match");
                res.json({message:"Fail", data:{}});
            }
        } else {
            console.log("user == null");
            res.json({message:"Fail", data:{}});
        }
    })
});
app.get("/users/session", function(req, res) {
    if (req.session.hasOwnProperty("_id")) {
        res.json({message:"Success", data:req.session._id});
    } else {
        res.json({message:"Fail", data:{}});
    }
});
app.all("*", (req,res,next) => {
    res.sendFile(path.resolve("./AngularApp/dist/index.html"));
});

var server = app.listen(8000, function () {
    console.log("listening on port 8000");
});

// socketMongo is for storing MongoDB _id's using socket.id's as keys
// mongoSocket stores socket.id using MongoDB _id's as keys
// gamestates stores gamestate objects using the associated room id as a key
// searchers is an array of mongodb ids of people looking for a game
// mongoGames stores the roomname of a player's current game using their MongoDB _id as a key.
var socketMongo = {}, mongoSocket = {}, gamestates = {}, searchers = [], mongoGames = {};

var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
    console.log("Client/socket is connected!");
    console.log("Client/socket id is: ", socket.id);
    socket.emit('hello', {data:'Hello'});
    socket.on("login", function(_id) {
        socketMongo[socket.id] = _id;
        console.log("socketMongo[socket.id]: " + socketMongo[socket.id]);
        mongoSocket[_id] = socket.id;
    });

    socket.on("checkRoom", function() {
        if (mongoGames.hasOwnProperty(socketMongo[socket.id])) {
            socket.emit("joinRoom", mongoGames[socketMongo[socket.id]]);
        }
    })
   
    socket.on("joinRoom", function(roomName) {
        console.log("Socket user is attempting to join room: " + roomName);
        socket.join(roomName);
    });

    socket.on("roomPing", function(data) {
        io.to(data['roomName']).emit('roomPing', data['data']);
    });

    socket.on("findGame", function() {
        console.log("socket.on('findGame')");
        console.log(searchers);
        console.log(socketMongo);
        if (socketMongo.hasOwnProperty(socket.id) && !searchers.includes(socketMongo[socket.id])) {
            searchers.push(socketMongo[socket.id]);
            if (searchers.length > 1) {
                let player1 = searchers.pop();
                let player2 = searchers.pop();
                if (player1 && player2) {
                    let roomstring = player1 + player2;
                    mongoGames[player1] = roomstring;
                    mongoGames[player2] = roomstring;
                    // Start gameloop
                    joinPing(player1, roomstring);
                    joinPing(player2, roomstring);
                    setTimeout(function() {
                        startGame(roomstring);
                    }, 3000);
                }
            }
        }
    });
    socket.on('disconnect', function() {
        console.log("Disconnect socket.id: " + socket.id + " mongo _id: " + socketMongo[socket.id]);
        delete mongoSocket[socketMongo[socket.id]]
        delete socketMongo[socket.id]
    });
});
function joinPing(mongoId, roomId) {
    console.log('function joinPing()');
    io.to(mongoSocket[mongoId]).emit('joinRoom', roomId)
}
function startGame(roomId, player1, player2) {
    console.log("startGame(roomId) was called. roomId: " + roomId);
    // initialize gamestate
    gamestates[roomId] = {
        player1: player1,
        player2: player2,
        player1Deck: [
            {}
        ]
    }
    io.to(roomId).emit("gamestate", gamestates[roomId]);
}