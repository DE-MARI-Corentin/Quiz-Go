const port_nodejs = 3201;
const express = require('express');
const app = express();
var path = require('path');
const momentjs = require('moment');

var __dirname = "/nfs/data01/data/uapv16/uapv1602174/public_html/QuizandGo";
//var server = app.listen(port_nodejs);
/*const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});*/

console.log(__dirname);
/*app.get('/login', (req, res) => {
	var p1 = req.query.username;
	var p2 = req.query.password;
    console.log(`go to : http://pedago.univ-avignon.fr:${port_nodejs}/login`);
    console.log(p1+' '+p2);
    res.send("log recu !");
});*/

var server = app.listen(port_nodejs, () => {
	console.log(port_nodejs);
  console.log(`Server running at http://pedago.univ-avignon.fr:${port_nodejs}/`);
});

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

//etape2

const session = require('express-session');
const post_greSQL = require('pg');
var utilisateur = new Object();
const MongoDBStore = require('connect-mongodb-session')(session);
var sha1 = require("crypto-js/sha1");

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json({limit:'10mb'}));

app.use(session({
    secret : " secret answer",
    saveUninitialized : true,
    resave : false,
    store : new MongoDBStore({ // instance de connect-mongodb-session
        uri: `mongodb://localhost/db`,
        collection: 'mySessions',
        touchAfter: 24 * 3600
}),
    cookie : {maxAge : 24 * 3600 * 1000} // millisecond valeur par défaut
}))

app.post('/login', (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    console.log(username + '   ' + sha1(password));
    var post_pool = new post_greSQL.Pool({user: 'uapv1602174', host: '127.0.0.1', database: 'etd', password: 'BiFhJe', port: 5432 });
    sql_request = "SELECT * FROM fredouil.users  WHERE identifiant='" + username +"' AND motpasse='" + sha1(password) + "' ;";
    post_pool.connect(function (err, client, done) {
        if (err) {
            console.log( err.stack);
        }else {

            client.query(sql_request, (err, result) => {
                if (err) {
                    console.log(err.stack);
                } else if (result.rows[0] != null) {
                    console.log(result.rows[0] );
                    utilisateur.nom = result.rows[0].nom;
                    utilisateur.id = result.rows[0].id;
                    utilisateur.humeur = result.rows[0].humeur;
                    utilisateur.prenom = result.rows[0].prenom;
                    utilisateur.usr = result.rows[0].identifiant;
                    utilisateur.statusMsg = 'Connexion réussie'+ result.rows[0].identifiant;
                    utilisateur.statusResp = true;
                    utilisateur.avatar = result.rows[0].avatar;
                    var date_naissance = result.rows[0].date_naissance;
                    utilisateur.dateBirth = momentjs(date_naissance).locale('fr').format('LL');
                    post_pool.connect(function (err, client, done) {
                                client.query("UPDATE fredouil.users SET statut_connexion = 1 WHERE id='" + utilisateur.id + "';");
                            });
                    utilisateur.statut_connexion = "1";
                    req.session.todayConnexion = Date.now();
                    req.session.username = username;
                    console.log("Connexion réussie " + req.session.username +' expire dans '+req.session.cookie.maxAge + ' secondes.');

                }else {

                    console.log('Connexion échouée :information de connexion incorrecte');
                    utilisateur.statusMsg = 'Connexion échouée :information de connexion incorrecte';
                    utilisateur.statusResp = false;
                }
                console.log(req.session);
                res.send(utilisateur);

            });
            client.release();
        }
    });

});

app.get('/logout',(request,res)=>{
    var post_pool = new post_greSQL.Pool({user: 'uapv1602174', host: '127.0.0.1', database: 'etd', password: 'BiFhJe', port: 5432 });
    console.log(utilisateur.id);
    sql_request = "UPDATE fredouil.users SET statut_connexion = 0 WHERE id='" + utilisateur.id + "';";    
    post_pool.connect(function (err, client, done) {
        if (err) {
            console.log( err.stack);
        }else {
            client.query(sql_request, (err, result) => {
                if (err) {
                    console.log(err.stack);
                }
                request.session.destroy();
                client.release();
                res.send(null);
            });
        }
    });
});





const MongoClient = require('mongodb').MongoClient; 
const dsnMongoDB = "mongodb://127.0.0.1:27017/db";
var Quizz = new Object();
var Question = new Object();
var Theme = new Object();
var Historique = new Object();
var Reponse = new Object();
const {ObjectId} = require('mongodb');


app.get('/HistoriqueId/:userId', (request, res) => {
    var Historique = new Object();
    var userId = request.params.userId;
    var post_pool = new post_greSQL.Pool({user: 'uapv1602174', host: '127.0.0.1', database: 'etd', password: 'BiFhJe', port: 5432 });
    sql_request = "SELECT * FROM fredouil.historique WHERE id_user='"+ userId  +"' order by date_jeu DESC;";
    post_pool.connect(function (err, client, done) {
        client.query(sql_request, (err, result) => {
            if (err)  console.log( err.stack);
            else {
                    Historique.list = result.rows;
                
                res.send(Historique);
            }
        });
        client.release();
    });
});




app.get('/Ranking/topTen/',(request, res) => {
    var Histo = new Object();
    var post_pool = new post_greSQL.Pool({user: 'uapv1602174', host: '127.0.0.1', database: 'etd', password: 'BiFhJe', port: 5432 });
    sql_request = "SELECT id_user,date_jeu,score, nom,prenom,identifiant FROM fredouil.historique join fredouil.users on id_user= fredouil.users.id  order by score desc limit 10;";
    post_pool.connect(function (err, client, done) {
        client.query(sql_request, (err, result) => {
            if (err)  console.log( err.stack);
            else {
                Histo.listo = result.rows;
                console.log(Histo);
                res.send(Histo);
            }
        });
        client.release();
    });
});


app.get('/Historique/add/:userId/:niveau/:nbrep/:temps/:score', (request, res) => {
    var niveau = request.params.niveau;
    var nbrep = request.params.nbrep;
    var temps = request.params.temps;
    var score = request.params.score;
    var userId = request.params.userId;

    var time_format = momentjs().format('YYYY-MM-DD HH:mm');

    var post_pool = new post_greSQL.Pool({user: 'uapv1602174', host: '127.0.0.1', database: 'etd', password: 'BiFhJe', port: 5432 });
    sql_request = "INSERT INTO fredouil.historique(id_user,date_jeu,niveau_jeu,nb_reponses_corr,temps,score) VALUES('"+ userId +"','"+ time_format +"','"+ niveau +"','"+ nbrep +"','"+ temps +"','"+ score +"');";
    post_pool.connect(function (err, client, done) {
        client.query(sql_request, (err, result) => {
            if (err)  console.log( err.stack);
        });
        client.release();
    });
});

app.get('/connected', (request, response) => {
    var Use = new Object();
    var post_pool2 = new post_greSQL.Pool({user: 'uapv1602174', host: '127.0.0.1', database: 'etd', password: 'BiFhJe', port: 5432 });
    sql_request2 = "SELECT distinct identifiant,nom, prenom,id, avatar FROM fredouil.users WHERE statut_connexion = 1;";
    post_pool2.connect(function (err, client, done) {
        client.query(sql_request2, (err, res) => {
            if (err) {
                console.log(err.stack);
            } else {
                //console.log(result.rows);
                Use.connected = res.rows;
                //console.log(Use);
                response.send(Use);
            }
        });
        client.release();
    });
});



app.get('/user/:userId', (request, response) => {
    var utilisateur = new Object();
    var userId = request.params.userId;
    var post_pool = new post_greSQL.Pool({user: 'uapv1602174', host: '127.0.0.1', database: 'etd', password: 'BiFhJe', port: 5432 });
    sql_request = "SELECT * FROM fredouil.users WHERE id = '"+userId+"';";
    post_pool.connect(function (err, client, done) {
        client.query(sql_request, (err, result) => {
            if (err) {
                console.log(err.stack);
            } else {
                //console.log(result.rows);
                utilisateur.nom = result.rows[0].nom;
                    utilisateur.id = result.rows[0].id;
                    utilisateur.humeur = result.rows[0].humeur;
                    utilisateur.prenom = result.rows[0].prenom;
                    utilisateur.usr = result.rows[0].identifiant;
                    utilisateur.statusMsg = 'Connexion réussie'+ result.rows[0].identifiant;
                    utilisateur.statusResp = true;
                    utilisateur.avatar = result.rows[0].avatar;
                    var date_naissance = result.rows[0].date_naissance;
                    utilisateur.dateBirth = momentjs(date_naissance).locale('fr').format('LL');

                response.send(utilisateur);
            }
        });
        client.release();
    });
});

app.get('/user/modif/:id/:humeur', (request, response) => {
    var humeur = request.params.humeur;
    var id = request.params.id;
    console.log(id);
    var post_pool = new post_greSQL.Pool({user: 'uapv1602174', host: '127.0.0.1', database: 'etd', password: 'BiFhJe', port: 5432 });
    sql_request = "UPDATE fredouil.users SET humeur = '" + humeur + "' WHERE id='" + id + "';";
    post_pool.connect(function (err, client, done) {
        client.query(sql_request, (err, result) => {
            if (err) {
                console.log(err.stack);
            } else {
                response.send(null);
            }
        });
        client.release();
    });
});



app.get('/play/choixTheme',(request,response)=>{
    const rand = [];
    MongoClient.connect(dsnMongoDB, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, mongoClient) {
        if(err) {return console.log('erreur connexion mongodb'); }
        if(mongoClient) {
            mongoClient.db().collection("quizz").distinct("thème",{}).then(res => {
                if (res != null) {
                    var random;
                    while(rand.length != 3){
                        random = Math.floor(Math.random() * Math.floor(res.length));
                        if(!rand.includes(random)) rand.push(random);
                    }
                    for(i = 0; i < rand.length;i++){
                        Theme[i] = res[rand[i]];
                    }
                }    
                console.log(Theme);     
                response.send(Theme);
             })
            .catch(err => console.log('erreur requete mongodb'));
        }
    });
});


app.get('/play/:theme/:niv',(request,response)=>{
    var niveau = request.params.niv;
    var theme = request.params.theme;
    MongoClient.connect(dsnMongoDB, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, mongoClient) {
        if(err) {return console.log('erreur connexion mongodb'); }
        if(mongoClient) {
            mongoClient.db().collection("quizz").find({thème: theme}, {projection:{_id:0, thème: 1, quizz: 2}}).toArray(function(error,res) {
                if(error) {return console.log('erreur requete mongodb'); }
                if (res != null) {
                    Quizz = res;
                    /*res[val].quizz.forEach(function (Y, i) {
                        Quizz[i] = res[val].quizz[i]
                    });*/
                }
                response.send(Quizz);
            });
        }
    });
});

app.get('/play/:theme/:niv/:numero',(request,response)=>{
    var niveau = request.params.niv;
    var theme = request.params.theme;
    var _id = request.params.numero;
    MongoClient.connect(dsnMongoDB, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, mongoClient) {
        if(err) {return console.log('erreur connexion mongodb'); }
        if(mongoClient) {
            mongoClient.db().collection("quizz").find({thème: theme}, {projection:{_id:0, thème: 1, quizz: 2}}).toArray(function(error,res) {
                if(error) {return console.log('erreur requete mongodb'); }
                if (res != null) {
                    Question.question = res[0].quizz[_id-1].question;
                    var propositions = res[0].quizz[_id-1].propositions;
                    var answer = res[0].quizz[_id-1].réponse;
                    const lstprop = [];
                    lstprop.push(answer);
                    while(lstprop.length != parseInt(niveau,'10')){
                        var random = Math.floor(Math.random() * Math.floor(propositions.length));
                        if(!lstprop.includes(propositions[random])) lstprop.push(propositions[random]);
                    }
                    //permet de ne pas toujours avoir la bonne réponse en premier
                    for (var i = lstprop.length - 1; i > 0; i--) {
                        var j = Math.floor(Math.random() * (i + 1));
                        var temp = lstprop[i];
                        lstprop[i] = lstprop[j];
                        lstprop[j] = temp;
                    }
                    Question.propositions = lstprop;
                    console.log(Question);
                }
                response.send(Question);
            });
        }
    });
});


app.get('/answer/:theme/:niv/:numero',(request,response)=>{
    var niveau = request.params.niv;
    var theme = request.params.theme;
    var _id = request.params.numero;
    MongoClient.connect(dsnMongoDB, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, mongoClient) {
        if(err) {return console.log('erreur connexion mongodb'); }
        if(mongoClient) {
            mongoClient.db().collection("quizz").find({thème: theme}, {projection:{_id:0, thème: 1, quizz: 2}}).toArray(function(error,res) {
                if(error) {return console.log('erreur requete mongodb'); }
                if (res != null) {
                    Reponse.anecdote = res[0].quizz[_id-1].anecdote;
                    Reponse.reponse = res[0].quizz[_id-1].réponse;
                }
                console.log(Reponse);
                response.send(Reponse);
            });
        }
    });
});

app.post('/defi/new',(req,response)=>{
    var idDefiant = req.body.idDefiant;
    var idDefie = req.body.idDefie;
    var quizz = req.body.quizz;
    var score = req.body.score;
    var theme = req.body.theme;
    var niveau = req.body.niveau;
    MongoClient.connect(dsnMongoDB, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, mongoClient) {
        if(err) {return console.log('erreur connexion mongodb'); }
        if(mongoClient) {
            const result = mongoClient.db().collection("defi").insertOne({id_user_defiant: idDefiant, id_user_defie: idDefie, score_user_defiant: score, quizz: quizz, theme: theme, niveau: niveau, idDev: 12});
            response.send(result.insertedCount);
        }
    });
});

app.get('/lstUser/:idUser', (request, response) => {
    var idUser = request.params.idUser;
    var lsUser = new Object();
    var post_pool2 = new post_greSQL.Pool({user: 'uapv1602174', host: '127.0.0.1', database: 'etd', password: 'BiFhJe', port: 5432 });
    sql_request2 = "SELECT identifiant,nom, prenom,id FROM fredouil.users where id != '" + idUser + "';";
    post_pool2.connect(function (err, client, done) {
        client.query(sql_request2, (err, res) => {
            if (err) {
                console.log(err.stack);
            } else {
                //console.log(result.rows);
                lsUser.list = res.rows;
                //console.log(Use);
                response.send(lsUser);
            }
        });
        client.release();
    });
});

app.get('/defi/:idUser',(request,response)=>{
    var idUser = request.params.idUser;
    MongoClient.connect(dsnMongoDB, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, mongoClient) {
        if(err) {return console.log('erreur connexion mongodb'); }
        if(mongoClient) {
            mongoClient.db().collection("defi").find({id_user_defie: parseInt(idUser), idDev: 12}).toArray(function(error,res) {
                if(error) {return console.log('erreur requete mongodb'); }
                console.log(res);
                response.send(res);
            });
        }
    });
});

app.get('/HistoDefi/:idUserG/:idUserP', (request, res) => {
    var id_user_gagnant = request.params.idUserG;
    var id_user_perdant = request.params.idUserP;
    var time_format = momentjs().format('YYYY-MM-DD HH:mm');

    var post_pool = new post_greSQL.Pool({user: 'uapv1602174', host: '127.0.0.1', database: 'etd', password: 'BiFhJe', port: 5432 });
    sql_request = "INSERT INTO fredouil.hist_defi(id_user_gagnant,id_user_perdant,date_defi) VALUES('"+ id_user_gagnant +"','"+ id_user_perdant +"','"+ time_format +"');";
    post_pool.connect(function (err, client, done) {
        client.query(sql_request, (err, result) => {
            if (err)  console.log( err.stack);
        });
        client.release();
    });
});

app.get('/countWinning/:idUser', (request, response) => {
    var idUser = request.params.idUser;
    var post_pool2 = new post_greSQL.Pool({user: 'uapv1602174', host: '127.0.0.1', database: 'etd', password: 'BiFhJe', port: 5432 });
    sql_request2 = "SELECT count(*) as nb FROM fredouil.hist_defi where id_user_gagnant = '" + idUser + "';";
    post_pool2.connect(function (err, client, done) {
        client.query(sql_request2, (err, res) => {
            if (err) {
                console.log(err.stack);
            } else {
                //console.log(result.rows);
                console.log(res.rows);
                response.send(res.rows);
            }
        });
        client.release();
    });
});


app.get('/remove/defi/:id',(request,response)=>{
    var id = request.params.id;
    MongoClient.connect(dsnMongoDB, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, mongoClient) {
        if(err) {return console.log('erreur connexion mongodb'); }
        if(mongoClient) {
            mongoClient.db().collection("defi").deleteOne({_id: ObjectId(id)},function(error,res) {
                if(error) {return console.log('erreur requete mongodb'); }
                response.send(res);
            });
        }
    });
});

/*const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
      origins: ['http://pedago.univ-avignon.fr:'+ port_nodejs]
    }
  });
//var io = require('socket.io').listen(server);
io.on('connection', (socket) => {
    console.log('a user connected');
  });
*/
//app.use(express.static(__dirname +'/etape0/'));

// ps -ef | grep nodejs
//kill -9 nodejs

//sudo kill `sudo lsof -t -i:3202`
