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
    let sampleDeck = {
        title: "MyDeck",
        cards: []
    }
    let cardArr = [
        [1,1,0,"Wisp"],
        [1,1,0,"Tree"],
        [1,3,1,"DireMole"],
        [2,1,1,"Murloc"],
        [3,2,2,"Raptor"],
        [3,2,2,"AcidOoze"],
        [4,1,2,"Duskboar"],
        [2,3,2,"Croclisk"],
        [3,3,3,"Grizzly"],
        [5,1,3,"MagmaMan"],
        [2,4,3,"Tentacle"],
        [3,6,4,"FireFly"],
        [4,5,4,"ChillYeti"],
        [5,4,4,"Ancient"],
        [4,6,5,"Smith"]
    ]
    for (let i=0; i<cardArr.length; i++) {
        let temp = {
            atk: cardArr[i][0],
            hp: cardArr[i][1],
            cost: cardArr[i][2],
            name: cardArr[i][3]
        }
        let temp2 = {
            atk: cardArr[i][0],
            hp: cardArr[i][1],
            cost: cardArr[i][2],
            name: cardArr[i][3]
        }
        sampleDeck.cards.push(temp);
        sampleDeck.cards.push(temp2);
    }
    newUser.decks.push(sampleDeck);
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
                res.json({message:"Success", data:{id:user._id, deck:user.decks[0]}});
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
app.post('/users/:id/adddeck', function(req, res) {
    console.log("app.post '/users/:id/adddeck' req.params.id: " + req.params.id);
    User.findOne({_id:req.params.id}, function(err, user) {
        if (user != null) {
            user.decks.push(req.body.deck);
            user.save(function(err) {
                if (err) {
                    res.json({message:"Fail", data:{}});
                } else {
                    res.json({message:"Success", data:user.decks});
                }
            });
        } else {
            res.json({message:"Fail", data:{}});
        }
    });
})
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
// mongoRoomId stores the roomname of a player's current game using their MongoDB _id as a key.
var socketMongo = {}, mongoSocket = {}, gamestates = {}, searchers = [], mongoRoomId = {};

var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
    console.log("Client/socket is connected!");
    console.log("Client/socket id is: ", socket.id);
    socket.on('hello', function() {
        socket.emit('hello', 'Hello');
    });
    socket.on("login", function(_id) {
        socketMongo[socket.id] = _id;
        console.log("socketMongo[socket.id]: " + socketMongo[socket.id]);
        mongoSocket[_id] = socket.id;
    });
    socket.on("checkRoom", function() {
        console.log("Checking for room")
        if (mongoRoomId.hasOwnProperty(socketMongo[socket.id])) {
            socket.emit("joinRoom", mongoRoomId[socketMongo[socket.id]]);
            socket.emit("gamestate", gamestates[mongoRoomId[socketMongo[socket.id]]]);
        }
    })
    socket.on("joinRoom", function(roomId) {
        console.log("Socket user is attempting to join room: " + roomId);
        socket.join(roomId);
    });

    socket.on("roomPing", function(data) {
        io.to(data['roomName']).emit('roomPing', data['data']);
    });
    socket.on('sendDeck', function(data) {
        for (let i=0; i<data['deck']['cards'].length; i++) {
            let idx = Math.floor(Math.random() * data['deck']['cards'].length);
            let temp = data['deck']['cards'][idx];
            data['deck']['cards'][idx] = data['deck']['cards'][i];
            data['deck']['cards'][i] = temp;
        }
        if (gamestates[data['roomId']]['player1'] == socketMongo[socket.id]) {
            console.log("Setting player 1 deck");
            gamestates[data['roomId']]['player1Deck'] = data['deck'];
        } else if (gamestates[data['roomId']]['player2'] == socketMongo[socket.id]) {
            console.log("Setting player 2 deck");
            gamestates[data['roomId']]['player2Deck'] = data['deck'];
        }
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
                    let roomId = player1 + player2;
                    mongoRoomId[player1] = roomId;
                    mongoRoomId[player2] = roomId;
                    // Start gameloop
                    gamestates[roomId] = {
                        player1: player1,
                        player2: player2,
                        activePlayer: player1,
                        inactivePlayer: player2,
                        player1Deck: [],
                        player2Deck: [],
                        player1Health: 30,
                        player2Health: 30,
                        player1Hand: [],
                        player2Hand: [],
                        player1Field: [],
                        player2Field: [],
                        player1ManaTotal: 0,
                        player2ManaTotal: 0,
                        player1ManaCurrent: 0,
                        player2ManaCurrent: 0
                    }
                    joinPing(player1, roomId);
                    joinPing(player2, roomId);
                    setTimeout(function() {
                        startGame(roomId, player1, player2);
                    }, 3000);
                }
            }
        }
    });

    socket.on('playCard', function(index) {
        console.log("Server Socket has received playCard ping. index: " + index);
        let roomId = mongoRoomId[socketMongo[socket.id]];
        io.to(roomId).emit('playCard', index);
        let playerString;
        if (gamestates[roomId]['player1'] == socketMongo[socket.id]) {
            playerString = 'player1';
        } else {
            playerString = 'player2';
        }
        console.log("Player's Hand: " + gamestates[roomId][playerString + 'Hand']);
        gamestates[roomId][playerString + 'ManaCurrent'] -= gamestates[roomId][playerString + 'Hand'][index]['cost'];
        gamestates[roomId][playerString + 'Hand'][index]['canAtk'] = false;
        gamestates[roomId][playerString + 'Field'].push(gamestates[roomId][playerString + 'Hand'].splice(index, 1)[0]);
    });

    socket.on('attack', function(obj) {
        let atkIdx = obj['atkIdx'], defIdx = obj['defIdx'], roomId = mongoRoomId[socketMongo[socket.id]];
        let playerString, opponentString;
        io.to(roomId).emit('attack', obj);
        if (gamestates[roomId]['player1'] == socketMongo[socket.id]) {
            playerString = 'player1';
            opponentString = 'player2';
        } else {
            playerString = 'player2';
            opponentString = 'player1';
        }
        gamestates[roomId][playerString + 'Field'][atkIdx]['canAtk'] = false
        if (defIdx == -1) {
            gamestates[roomId][opponentString + "Health"] -= gamestates[roomId][playerString + 'Field'][atkIdx]['atk'];
        } else {
            gamestates[roomId][opponentString + 'Field'][defIdx]['hp'] -= gamestates[roomId][playerString + 'Field'][atkIdx]['atk'];
            gamestates[roomId][playerString + 'Field'][defIdx]['hp'] -= gamestates[roomId][opponentString + 'Field'][defIdx]['atk'];
            if (gamestates[roomId][opponentString + 'Field'][defIdx]['hp'] <= 0) {
                gamestates[roomId][opponentString + 'Field'].splice(defIdx, 1);
            }
            if (gamestates[roomId][playerString + 'Field'][defIdx]['hp'] <= 0) {
                gamestates[roomId][playerString + 'Field'].splice(atkIdx, 1);
            }
        }
    });
    socket.on('endTurn', function() {
        let roomId = mongoRoomId[socketMongo[socket.id]]
        let temp = gamestates[roomId]['inactivePlayer']
        gamestates[roomId]['inactivePlayer'] = gamestates[roomId]['activePlayer']
        gamestates[roomId]['activePlayer'] = temp;
        let playerString;
        if (temp == gamestates[roomId]['player1']) {
            playerString = 'player1';
        } else {
            playerString = 'player2';
        }
        gamestates[roomId][playerString + 'Hand'].push(gamestates[roomId][playerString + 'Deck']['cards'].pop());
        if (gamestates[roomId][playerString + 'ManaTotal'] < 10) {
            gamestates[roomId][playerString + 'ManaTotal']++;
        }
        gamestates[roomId][playerString + 'ManaCurrent'] = gamestates[roomId][playerString + 'ManaTotal'];
        for (let i=0; i<gamestates[roomId][playerString + 'Field'].length; i++) {
            gamestates[roomId][playerString + 'Field'][i]['canAtk'] = true;
        }
        io.to(roomId).emit('startTurn');
    });
    socket.on('Victory', function() {
        io.to(roomId).emit('Victory', socketMongo[socket.id]);
    });
    socket.on('disconnect', function() {
        console.log("Disconnect socket.id: " + socket.id + " mongo _id: " + socketMongo[socket.id]);
        delete mongoSocket[socketMongo[socket.id]]
        delete socketMongo[socket.id]
    });
});
function joinPing(mongoId, roomId) {
    console.log('function joinPing()');
    io.to(mongoSocket[mongoId]).emit('joinRoom', roomId);
    io.to(mongoSocket[mongoId]).emit('getDeck', roomId);
}
function startGame(roomId, player1, player2) {
    console.log("startGame(roomId) was called. roomId: " + roomId);
    for (let i=0; i<3; i++) {
        gamestates[roomId]['player1Hand'].push(gamestates[roomId]['player1Deck']['cards'].pop());
        gamestates[roomId]['player2Hand'].push(gamestates[roomId]['player2Deck']['cards'].pop());
    }
    io.to(roomId).emit("gamestate", gamestates[roomId]);
    setTimeout(function() {
        // This is all hardcoded to have player1 going first. If we make it a flip to see
        // Who goes first, this will need reworking
        gamestates[roomId]['player1Hand'].push(gamestates[roomId]['player1Deck']['cards'].pop());
        gamestates[roomId]['player1ManaTotal'] = 1;
        gamestates[roomId]['player1ManaCurrent'] = 1;
        io.to(roomId).emit('startTurn');
    }, 1000)
}
