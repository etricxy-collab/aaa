const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

let players = [];
let compteur_question = 0;

// Fausses identités (en dur pour fonctionner partout)
const FAKE_NAMES = ["Maurice", "Léo", "Adrien", "Jean-Paul", "Robert"];
const FAKE_IMAGES = [
  "https://cdn.glitch.global/d9fac2fb-dd5e-4283-800f-e504a6e4a40c/MauricePhoto.png?v=1666706514454",
  "https://cdn.glitch.global/d9fac2fb-dd5e-4283-800f-e504a6e4a40c/LeoPhoto.png?v=1666706516146",
  "https://cdn.glitch.global/d9fac2fb-dd5e-4283-800f-e504a6e4a40c/AdrienPhoto.png?v=1666706516325",
  "https://cdn.glitch.global/d9fac2fb-dd5e-4283-800f-e504a6e4a40c/JeanPaulPhoto.png?v=1666706516235",
  "https://cdn.glitch.global/d9fac2fb-dd5e-4283-800f-e504a6e4a40c/RobertPhoto.png?v=1666706514835",
];

///////////////////////////////////////////
// QUESTIONS
//////////////////////////////////////////
let Questionnaire = [
  { question: "Si tu pouvais être invisible pendant une journée, tu ferais quoi en premier (et sois honnête) ?", numero: "Question n°1/30" },
  { question: "Quel est le mensonge le plus ridicule que tu aies déjà raconté ?", numero: "Question n°2/30" },
  { question: "Si ta vie était un film, quel serait le titre le plus honteux ?", numero: "Question n°3/30" },
  { question: "actrice que tu veux bz ?", numero: "Question n°4/30" },
  { question: "Quel super-pouvoir inutile tu aimerais avoir ?", numero: "Question n°5/30" },
  { question: "qui a le plus de luck ?", numero: "Question n°6/30" },
  { question: "Tu préfères combattre un cheval de la taille d’un canard ou 100 canards de la taille d’un cheval ?", numero: "Question n°7/30" },
  { question: "Fantasmez-vous sur les pied ?", numero: "Question n°8/30" },
  { question: "Quelle est la chose la plus bizarre que tu aies mangée ?", numero: "Question n°9/30" },
  { question: "Selon vous, qui a la plus grosse bite ?", numero: "Question n°10/30" },
  { question: "Si tu devais changer de prénom demain, tu prendrais quoi ?", numero: "Question n°11/30" },
  { question: "Quel animal te représente le mieux quand tu es fatigué ?", numero: "Question n°12/30" },
  { question: "Tu as déjà parlé tout seul en pensant que personne n’écoutait… et quelqu’un t’a entendu ?", numero: "Question n°13/30" },
  { question: "Quel est ton talent caché le plus inutile ?", numero: "Question n°14/30" },
  { question: "Si tu étais un villager dans un jeu, tu vendrais quoi ?", numero: "Question n°15/30" },
  { question: "Tu préfères avoir des mains à la place des pieds ou des pieds à la place des mains ?", numero: "Question n°16/30" },
  { question: "Quel est le pire conseil que tu aies jamais donné ?", numero: "Question n°17/30" },
  { question: "Si ton frigo pouvait parler, il dirait quoi sur toi ?", numero: "Question n°18/30" },
  { question: "Tu as déjà fait semblant de comprendre un truc alors que tu n’avais rien capté ?", numero: "Question n°19/30" },
  { question: "Quelle chanson tu chanterais pour sauver le monde (même si tu chantes mal) ?", numero: "Question n°20/30" },
  { question: "Si tu devais vivre dans un dessin animé, lequel tu choisirais ?", numero: "Question n°21/30" },
  { question: "Quel est ton excuse la plus nulle pour arriver en retard ?", numero: "Question n°22/30" },
  { question: "Tu préfères ne plus jamais pouvoir mentir ou ne plus jamais pouvoir dire la vérité ?", numero: "Question n°23/30" },
  { question: "Quelle est la chose la plus random que tu aies googliée à 3h du matin ?", numero: "Question n°24/30" },
  { question: "Si tu étais un objet du quotidien, tu serais quoi ?", numero: "Question n°25/30" },
  { question: "Tu as déjà ri à un enterrement ou dans une situation hyper sérieuse ?", numero: "Question n°26/30" },
  { question: "Quel personnage de film tu incarnerais le mieux (pour de mauvaises raisons)", numero: "Question n°27/30" },
  { question: "Tu préfères sentir toujours légèrement le fromage ou avoir des chaussettes mouillées en permanence?", numero: "Question n°28/30" },
  { question: "Quelle est la chose la plus immature que tu fasses encore ?", numero: "Question n°29/30" },
  { question: "Si tu pouvais interdire un mot pour toujours, ce serait leque?", numero: "Question n°30/30" },
  { question: "Tu as déjà envoyé un message à la mauvaise personne… et paniqué ensuite ?", numero: "Demutez vous" },
];

app.use(express.static(__dirname + "/public"));

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

io.on("connection", function (socket) {
  // ========== CONNEXION ==========
  socket.on("user_join", (name) => {
    name = (name || "").trim();
    if (!name) {
      socket.emit("erreur", "Pseudo invalide");
      return;
    }
    if (players.some((p) => p.name === name)) {
      socket.emit("erreur", "Pseudo déjà pris");
      return;
    }

    // Choisir une fausse identité encore libre
    const available = FAKE_NAMES.filter(
      (fake) => !players.some((p) => p.pseudo === fake)
    );
    if (available.length === 0) {
      socket.emit("erreur", "Plus de places disponibles (max 5 joueurs)");
      return;
    }

    const prenomJoueur =
      available[Math.floor(Math.random() * available.length)];
    const photoJoueur = FAKE_IMAGES[FAKE_NAMES.indexOf(prenomJoueur)];

    const player = {
      id: socket.id,
      name: name,
      points: 0,
      pseudo: prenomJoueur,
      image: photoJoueur,
    };

    players.push(player);
    console.log(name + " vient de se connecter → " + prenomJoueur);

    // Envoie la fausse identité seulement à ce joueur
    socket.emit("pseudo_joueur", prenomJoueur);

    // Met à jour la salle d'attente pour TOUT LE MONDE
    AttenteUpdate();
  });

  // ========== RÉPONSE À UNE QUESTION (corrigé) ==========
  // On identifie le joueur par socket.id (fiable)
  socket.on("send_response", function (reponse) {
    if (reponse === "ChronoStart123") return;

    const player = players.find((p) => p.id === socket.id);
    if (!player) {
      console.log("Joueur introuvable pour cette réponse");
      return;
    }

    // Empêche de répondre plusieurs fois à la même question
    if (player.hasOwnProperty("reponse" + compteur_question)) {
      console.log(player.name + " a déjà répondu → ignoré");
      return;
    }

    player["reponse" + compteur_question] = reponse;
    console.log(
      player.name + " a répondu à la question " + (compteur_question + 1)
    );

    CheckReponse();
  });

  // ========== MESSAGE PRIVÉ ==========
  socket.on(
    "messagePrivate",
    function (pseudoJoueurEnvoi, pseudoJoueurRecu, reponse) {
      io.emit(
        "MessagePriveEnvoi",
        pseudoJoueurRecu,
        pseudoJoueurEnvoi,
        reponse
      );
      io.emit("updateNotif", pseudoJoueurEnvoi, pseudoJoueurRecu);
    }
  );

  // ========== VOIR LES RÉPONSES D'UN JOUEUR ==========
  socket.on("voirReponsesJoueur", function (data, name) {
    let j = 0;
    if (data == "joueur1") j = 0;
    if (data == "joueur2") j = 1;
    if (data == "joueur3") j = 2;
    if (data == "joueur4") j = 3;
    if (data == "joueur5") j = 4;

    let QuestionJoueur = [];
    let reponseJoueur = [];

    for (let i = 0; i < 30; i++) {
      QuestionJoueur[i] = Questionnaire[i].question;
    }

    for (let i = 0; i <= 30; i++) {
      reponseJoueur[i] = players[j] ? players[j]["reponse" + i] : undefined;
    }

    io.emit("AfficherReponsesJoueur", QuestionJoueur, reponseJoueur, name);
  });

  // ========== AFFICHER LES VRAIES IDENTITÉS ==========
  socket.on("reponse_afficher_final", function () {
    let playersName = [];
    let playersPseudo = [];
    let imagesJoueur = [];

    for (let i = 0; i < players.length; i++) {
      playersName[i] = players[i].name;
      playersPseudo[i] = players[i].pseudo;
      imagesJoueur[i] = players[i].image;
    }

    io.emit(
      "reponse_afficher_final_All",
      playersName,
      playersPseudo,
      imagesJoueur
    );
  });

  // ========== MESSAGE PUBLIC ==========
  socket.on("user_message", function (pseudoJoueur, reponseDuJoueur) {
    if (reponseDuJoueur != process.env.SKIPPING) {
      io.emit("updateNewMessage", pseudoJoueur, reponseDuJoueur);
    } else {
      DebutRelier();
    }
  });

  socket.on("delete_message", () => {
    ClearGame();
  });

  // ========== LANCER LE JEU ==========
  socket.on("CommencerJeu", () => {
    compteur_question = 0;
    // On remet les réponses à zéro pour une nouvelle partie
    players.forEach((p) => {
      for (let i = 0; i <= 35; i++) {
        delete p["reponse" + i];
        delete p["reponses3" + i];
      }
    });
    io.emit("StartGame", "lancer le jeu");
    ClearGame();
  });

  // ========== VOIR LE CLASSEMENT ==========
  socket.on("VoirPoints", () => {
    const leaderboard = players
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);
    io.emit("AfficherPoints", leaderboard);
  });

  // ========== RÉPONSES PHASE RELIER ==========
  socket.on("reponse_relier", function (name, reponses) {
    for (let i = 0; i < players.length; i++) {
      if (players[i].name == name) {
        players[i]["reponses31"] = reponses[0];
        players[i]["reponses32"] = reponses[1];
        players[i]["reponses33"] = reponses[2];
        players[i]["reponses34"] = reponses[3];
        players[i]["reponses35"] = reponses[4];
      }
    }
    CheckReponsePoints(socket.id);
  });

  // ========== DÉCONNEXION ==========
  socket.on("disconnect", function () {
    players = players.filter((player) => player.id !== socket.id);
    AttenteUpdate();
    console.log(socket.id + " vient de se déconnecter");
  });
});

// ========== FONCTIONS ==========

function AttenteUpdate() {
  const liste = players.map((p) => p.name);
  io.emit("update_Attente", liste);
  console.log("Salle d'attente :", liste);
}

function CheckReponse() {
  if (players.length === 0) return;

  const ontRepondu = players.filter((p) =>
    p.hasOwnProperty("reponse" + compteur_question)
  );

  console.log(
    `Réponses reçues : ${ontRepondu.length} / ${players.length}`
  );

  // Seulement quand TOUT LE MONDE a répondu
  if (ontRepondu.length === players.length) {
    console.log("Tout le monde a répondu → question suivante");
    compteur_question += 1;
    updateGame();
  }
}

function CheckReponsePoints(id) {
  const JoueurNombre = players.length;
  const ReponsesNumero = [
    "reponses31",
    "reponses32",
    "reponses33",
    "reponses34",
    "reponses35",
  ];

  for (let j = 0; j < players.length; j++) {
    if (players[j].id == id) {
      for (let k = 0; k < JoueurNombre; k++) {
        if (
          players[k] &&
          players[j][ReponsesNumero[k]] == players[k].name
        ) {
          increasePoints(id);
        }
      }
    }
  }
}

function increasePoints(id) {
  players = players.map((player) => {
    if (player.id == id) {
      return { ...player, points: player.points + 10 };
    }
    return player;
  });
}

function ClearGame() {
  io.emit("delete_chat", "");
  updateGame();
}

function updateGame() {
  if (compteur_question >= 30) {
    DebutRelier();
    return;
  }

  io.emit("send_question", Questionnaire[compteur_question]);

  const pseudoJoueurs = players.map((p) => p.pseudo);
  const imageJoueurs = players.map((p) => p.image);
  io.emit("update_players", pseudoJoueurs, imageJoueurs);
}

function DebutRelier() {
  const noms = players.map((p) => p.name);
  const pseudo = players.map((p) => p.pseudo);
  io.emit("debutRelier", noms, pseudo);
}

http.listen(process.env.PORT || 3000, function () {
  console.log("Serveur démarré sur le port " + (process.env.PORT || 3000));
});
