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
  { question: "Comment allez vous ?", numero: "Question n°1/30" },
  { question: "Quel est votre jeu vidéo préféré ?", numero: "Question n°2/30" },
  { question: "Quel est la dernière chanson que vous avez écouté ?", numero: "Question n°3/30" },
  { question: "Que mangez vous généralement le matin au petit déjeuner ?", numero: "Question n°4/30" },
  { question: "Un bébé pleure dans votre train depuis 4 heures, comment réagiriez vous ?", numero: "Question n°5/30" },
  { question: "Quel est votre dernière commande Uber Eats ?", numero: "Question n°6/30" },
  { question: "Si vous pouviez virer un mec du vocal de manière permanente, lequel serait-ce ?", numero: "Question n°7/30" },
  { question: "Fantasmez-vous sur les naines ?", numero: "Question n°8/30" },
  { question: "Est-ce que vous vous trouvez objectivement beau ?", numero: "Question n°9/30" },
  { question: "Selon vous, qui est la plus grosse fraude sur Twitch ?", numero: "Question n°10/30" },
  { question: "Quel est la plus grosse célébrité que vous ayez croisé dans votre vie ?", numero: "Question n°11/30" },
  { question: "Marque de vêtement que vous préférez porter ?", numero: "Question n°12/30" },
  { question: "Quel accent vous fait le plus rire ?", numero: "Question n°13/30" },
  { question: "Destination de rêve ?", numero: "Question n°14/30" },
  { question: "Vous prenez quel streameur à la bagarre ?", numero: "Question n°15/30" },
  { question: "La dernière fois que vous avez pleuré, c'était pour quoi ?", numero: "Question n°16/30" },
  { question: "Quel est le nom de votre animal de compagnie ?", numero: "Question n°17/30" },
  { question: "Pour combien accepteriez-vous de porter des vêtements pourris (unicorn, unkut, etc..) ?", numero: "Question n°18/30" },
  { question: "L'âge de votre première branlette, juste pour savoir ^^ ?", numero: "Question n°19/30" },
  { question: "Quel est l'objet de plus grosse valeur que vous ayez volé ?", numero: "Question n°20/30" },
  { question: "Quel adjectif qualifie le mieux Quentin pour vous ?", numero: "Question n°21/30" },
  { question: "Dites moi votre fantasme sexuel irréalisable ?", numero: "Question n°22/30" },
  { question: "FLASH : Mathieu est mort d'une crise cardiaque !! Votre idée de costume à l'enterrement ?", numero: "Question n°23/30" },
  { question: "Quel rôle de cinéma est le mieux fait pour vous et pourquoi : James bond ou Scott Pilgrim ?", numero: "Question n°24/30" },
  { question: "Quel est la première chose que vous regardez chez une femme ?", numero: "Question n°25/30" },
  { question: "Quand vous étiez gosse, quel était le métier de vos rêves ?", numero: "Question n°26/30" },
  { question: "On vous annonce que Clément à pris de la prison ferme, pour quel motif selon vous", numero: "Question n°27/30" },
  { question: "Votre plus gros défaut physique ?", numero: "Question n°28/30" },
  { question: "Le pire endroit où vous avez chié ?", numero: "Question n°29/30" },
  { question: "Quel est votre don maximum au Zevent ?", numero: "Question n°30/30" },
  { question: "C'est fini ! Préparez-vous à relier les fausses identités aux vraies !", numero: "Demutez vous" },
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
