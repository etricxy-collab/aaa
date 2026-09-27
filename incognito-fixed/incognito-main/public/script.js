const pseudo = document.getElementById("form_pseudo");
const submission = document.getElementById("form_jeu");
const submission_pm = document.getElementById("form_pm");
const intro = document.getElementById("intro");
const attente = document.getElementById("salle_attente");
const game = document.getElementById("game");
const outro_relier = document.getElementById("outro_relier");
const outro_finale = document.getElementById("outro_finale");
const private_message = document.getElementById("private_message");
const classement = document.getElementById("leaderboard");
const img_retour = document.getElementById("img_retour");
const img_send = document.getElementById("img_send");
const reponse_finale = document.getElementById("reponse_finale");
const joueur_1 = document.getElementById("joueur_1");
const joueur_2 = document.getElementById("joueur_2");
const joueur_3 = document.getElementById("joueur_3");
const joueur_4 = document.getElementById("joueur_4");
const joueur_5 = document.getElementById("joueur_5");

// TIMER
const timer = document.getElementById("timer");
let socket = undefined;
let name = "anonyme";
let pseudoJoueur = "Couscous";
let pseudoJoueurRecu = "Tajine";
let envoi_boolean = false;
let pseudoQuiNousDM = "";

document.getElementById("lancer_jeu").addEventListener("click", function (e) {
  if (socket) socket.emit("CommencerJeu", "start");
});

joueur_1.addEventListener("click", function (e) {
  if (socket) socket.emit("voirReponsesJoueur", "joueur1", name);
});
joueur_2.addEventListener("click", function (e) {
  if (socket) socket.emit("voirReponsesJoueur", "joueur2", name);
});
joueur_3.addEventListener("click", function (e) {
  if (socket) socket.emit("voirReponsesJoueur", "joueur3", name);
});
joueur_4.addEventListener("click", function (e) {
  if (socket) socket.emit("voirReponsesJoueur", "joueur4", name);
});
joueur_5.addEventListener("click", function (e) {
  if (socket) socket.emit("voirReponsesJoueur", "joueur5", name);
});

img_retour.addEventListener("click", function (e) {
  private_message.classList.add("hidden");
  game.classList.remove("hidden");
});

document.getElementById("img_retour2").addEventListener("click", function (e) {
  document.getElementById("historique_joueur").classList.add("hidden");
  document.getElementById("outro_relier").classList.remove("hidden");
});

reponse_finale.addEventListener("click", function (e) {
  reponse_finale.classList.add("hidden");
  let reponses = [];
  reponses[0] = document.getElementById("pseudo-select").value;
  reponses[1] = document.getElementById("pseudo-select2").value;
  reponses[2] = document.getElementById("pseudo-select3").value;
  reponses[3] = document.getElementById("pseudo-select4").value;
  reponses[4] = document.getElementById("pseudo-select5").value;
  if (envoi_boolean == false && socket) {
    socket.emit("reponse_relier", name, reponses);
    envoi_boolean = true;
  }
});

// ========== ENVOI RÉPONSE (formulaire) ==========
submission.addEventListener("submit", function (evt) {
  evt.preventDefault();
  const reponse = evt.target["reponse"]
    ? evt.target["reponse"].value
    : document.getElementById("reponse").value;
  if (reponse && socket) {
    socket.emit("user_message", pseudoJoueur, reponse);
    socket.emit("send_response", reponse); // seulement la réponse
    if (evt.target["reponse"]) evt.target["reponse"].value = "";
    else document.getElementById("reponse").value = "";
  }
});

// ========== ENVOI RÉPONSE (bouton image) ==========
img_send.addEventListener("click", function (e) {
  e.preventDefault();
  const reponse = document.getElementById("reponse").value;
  if (reponse && socket) {
    socket.emit("user_message", pseudoJoueur, reponse);
    socket.emit("send_response", reponse); // seulement la réponse
    document.getElementById("reponse").value = "";
  }
});

// ========== CONNEXION (corrigé) ==========
// L'input a id="name" mais pas d'attribut name → on utilise getElementById
pseudo.addEventListener("submit", function (evt) {
  evt.preventDefault();

  const input = document.getElementById("name");
  name = input ? input.value.trim() : "";

  if (!name) {
    alert("Écris un pseudo !");
    return;
  }

  // 1. Créer la socket
  socket = window.io();

  // 2. Mettre TOUS les écouteurs AVANT d'émettre
  StartGame();

  // 3. Ensuite seulement rejoindre
  socket.emit("user_join", name);
});

// ========== MESSAGE PRIVÉ ==========
submission_pm.addEventListener("submit", function (evt) {
  evt.preventDefault();
  const reponse = evt.target["reponse_pv"].value;
  if (reponse && socket) {
    socket.emit("messagePrivate", pseudoJoueur, pseudoJoueurRecu, reponse);
    evt.target["reponse_pv"].value = "";
  }
});

document.getElementById("mpChat").addEventListener("click", function (e) {
  const collection = document
    .getElementById("mpChat")
    .getElementsByTagName("li");
  for (let i = 0; i < collection.length; i++) {
    collection[i].style.color = "white";
  }
  if (
    e.target &&
    e.target.matches("li") &&
    e.target.innerText != "Vous(" + pseudoJoueur + ")"
  ) {
    game.classList.add("hidden");
    pseudoJoueurRecu = e.target.innerText;
    private_message.classList.remove("hidden");
  }
});

// TIMER
const departMinutes = 2;
let temps = departMinutes * 60;

function start() {
  this.interval = setInterval(() => {
    let minutes = parseInt(temps / 60, 10);
    let secondes = parseInt(temps % 60, 10);
    minutes = minutes < 10 ? "0" + minutes : minutes;
    secondes = secondes < 10 ? "0" + secondes : secondes;
    counterStyle();
    CheckTemps();
    timer.value = `${minutes}:${secondes}`;
    temps = temps <= 0 ? 0 : temps - 1;
  }, 1000);
}

function CheckTemps() {
  if (temps == 0) {
    if (envoi_boolean == false && socket) {
      let reponses = [];
      reponses[0] = document.getElementById("pseudo-select").value;
      reponses[1] = document.getElementById("pseudo-select2").value;
      reponses[2] = document.getElementById("pseudo-select3").value;
      reponses[3] = document.getElementById("pseudo-select4").value;
      reponses[4] = document.getElementById("pseudo-select5").value;
      socket.emit("reponse_relier", name, reponses);
    }
    if (socket) socket.emit("reponse_afficher_final", "Quelle etait la reponse ?");
    clearInterval(this.interval);
    delete this.interval;
  }
}

function counterStyle() {
  if (temps < 90) {
    timer.classList.remove("text-green-400");
    timer.classList.add("text-orange-400");
  } else {
    timer.classList.remove("text-orange-400");
    timer.classList.add("text-green-400");
  }
}

function playSound(audioName) {
  let audio = new Audio(audioName);
  audio.volume = 0.5;
  audio.play();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function AfficherRep(prenom, pseudo, imageRecu) {
  let j = 0;
  let k = prenom.length;
  do {
    for (let i = 0; i < 5; i++) {
      document.getElementById("img_final").style.width = "72px";
      document.getElementById("img_final").src = imageRecu[j];
      document.getElementById("vrai_pseudo").innerHTML =
        pseudo[j] + " était ...";
      document.getElementById("vrai_prenom").innerHTML = prenom[j];
      if (i == 3) {
        document.getElementById("vrai_prenom").classList.remove("hidden");
      }
      await sleep(i * 1000);
    }
    document.getElementById("vrai_prenom").classList.add("hidden");
    j += 1;
  } while (j < k);
  outro_finale.classList.add("hidden");
  if (socket) socket.emit("VoirPoints", "voir les points");
}

function StartGame() {
  // Affiche la salle d'attente
  intro.classList.add("hidden");
  attente.classList.remove("hidden");

  // ===== TOUS LES ÉCOUTEURS =====
  socket.on("send_question", (questionnaire) => {
    const node1 = document.createElement("li");
    const node2 = document.createElement("li");

    node1.innerHTML = questionnaire.question;
    node1.style.fontSize = "x-large";
    node1.style.margin = "auto";
    node1.style.marginTop = "10px";
    node1.setAttribute("id", "titre2");

    node2.innerHTML = questionnaire.numero;
    node2.style.fontSize = "small";
    node2.style.width = "max-content";
    node2.style.margin = "auto";

    document.getElementById("mychat").appendChild(node1);
    document.getElementById("mychat").appendChild(node2);
    $("#all_game").scrollTop($("#all_game")[0].scrollHeight);
  });

  socket.on("AfficherPoints", (leaderboard) => {
    document.getElementById("points_joueur").classList.remove("hidden");
    classement.innerHTML = `
    ${leaderboard
      .map(
        (player) =>
          `<li class="flex justify-between items-center">
            <img class="w-20 h-20" src="${player.image}"/>
            <strong>${player.name}</strong> ${player.points}
          </li>`
      )
      .join("")}
    `;
  });

  socket.on("pseudo_joueur", function (data) {
    pseudoJoueur = data;
  });

  socket.on("delete_chat", function () {
    document.getElementById("mychat").innerHTML = "";
  });

  socket.on("StartGame", function () {
    attente.classList.add("hidden");
    game.classList.remove("hidden");
  });

  socket.on("update_Attente", function (pseudoJoueursAttente) {
    document.getElementById("salle_joueur").innerHTML = "";
    const liste = [...pseudoJoueursAttente].sort();

    liste.forEach((pseudo) => {
      const node = document.createElement("li");
      node.textContent = pseudo;
      node.style.fontSize = "x-large";
      node.style.margin = "auto";
      node.style.marginTop = "5px";

      const img = document.createElement("img");
      img.src =
        "https://cdn.glitch.global/d9fac2fb-dd5e-4283-800f-e504a6e4a40c/incconnu.png?v=1666717467513";
      img.style.width = "72px";

      document.getElementById("salle_joueur").appendChild(img);
      document.getElementById("salle_joueur").appendChild(node);
    });
  });

  socket.on("erreur", function (msg) {
    alert(msg);
  });

  socket.on(
    "AfficherReponsesJoueur",
    function (QuestionJoueur, reponseJoueur, nameRecu) {
      if (name == nameRecu) {
        document.getElementById("HistoriqueChat").innerHTML = "";
        for (let i = 0; i < QuestionJoueur.length; i++) {
          const node1 = document.createElement("li");
          node1.textContent = i + 1 + " - " + QuestionJoueur[i];
          node1.style.color = "#1260CC";
          node1.style.fontSize = "large";
          node1.style.margin = "auto";
          node1.style.marginTop = "5px";

          const node2 = document.createElement("li");
          node2.textContent = reponseJoueur[i] || "";
          node2.style.color = "white";
          node2.style.fontSize = "large";
          node2.style.margin = "auto";
          node2.style.marginTop = "5px";

          document.getElementById("HistoriqueChat").appendChild(node1);
          document.getElementById("HistoriqueChat").appendChild(node2);
        }
        document.getElementById("historique_joueur").classList.remove("hidden");
        document.getElementById("outro_relier").classList.add("hidden");
      }
    }
  );

  socket.on(
    "reponse_afficher_final_All",
    function (prenom, pseudo, imagesJoueur) {
      outro_relier.classList.add("hidden");
      document.getElementById("historique_joueur").classList.add("hidden");
      outro_finale.classList.remove("hidden");
      AfficherRep(prenom, pseudo, imagesJoueur);
    }
  );

  socket.on("debutRelier", function (noms, pseudo) {
    start();
    const playersConfig = [
      { buttonId: "joueur_1", selectId: "pseudo-select", divId: "duo_un" },
      { buttonId: "joueur_2", selectId: "pseudo-select2", divId: "duo_deux" },
      { buttonId: "joueur_3", selectId: "pseudo-select3", divId: "duo_trois" },
      { buttonId: "joueur_4", selectId: "pseudo-select4", divId: "duo_quatre" },
      { buttonId: "joueur_5", selectId: "pseudo-select5", divId: "duo_cinq" },
    ];

    for (let i = 0; i < playersConfig.length; i++) {
      const conf = playersConfig[i];
      const div = document.getElementById(conf.divId);
      if (i < pseudo.length) {
        div.style.display = "block";
        const button = document.getElementById(conf.buttonId);
        button.value = pseudo[i];
        button.style.background = "#ffb6c1";
        button.style.borderRadius = "25px";
        button.style.width = "max-content";
        button.style.paddingLeft = "5px";
        button.style.paddingRight = "5px";
      } else {
        div.style.display = "none";
      }
    }

    // Remplir les selects
    for (let i = 0; i < pseudo.length; i++) {
      for (let j = 0; j < playersConfig.length; j++) {
        const select = document.getElementById(playersConfig[j].selectId);
        // Éviter les doublons
        let exists = false;
        for (let opt of select.options) {
          if (opt.value === pseudo[i]) exists = true;
        }
        if (!exists) {
          const opt = document.createElement("option");
          opt.value = pseudo[i];
          opt.text = pseudo[i];
          select.appendChild(opt);
        }
      }
    }

    game.classList.add("hidden");
    outro_relier.classList.remove("hidden");
  });

  socket.on("updateNotif", function (pseudoJoueurEnvoi, pseudoJoueurRecu) {
    if (pseudoJoueur == pseudoJoueurRecu) {
      const collection = document
        .getElementById("mpChat")
        .getElementsByTagName("li");
      for (let i = 0; i < collection.length; i++) {
        if (collection[i].innerHTML == pseudoJoueurEnvoi) {
          collection[i].style.color = "green";
        }
      }
    }
  });

  socket.on("MessagePriveEnvoi", function (PseudoRecu, PseudoEnvoi, Message) {
    if (pseudoJoueur == PseudoEnvoi || pseudoJoueur == PseudoRecu) {
      const node1 = document.createElement("li");
      const node2 = document.createElement("li");
      const node3 = document.createElement("li");

      node1.textContent = PseudoEnvoi;
      node1.style.marginTop = "15px";
      node1.style.color = "#ffb6c1";

      node2.textContent = Message;
      node2.style.color = "black";
      node2.style.background = "#ffb6c1";
      node2.style.borderRadius = "25px";
      node2.style.width = "max-content";
      node2.style.paddingLeft = "5px";
      node2.style.paddingRight = "5px";
      node2.style.fontSize = "20px";

      node3.innerHTML = "Nouveau Message";
      node3.style.paddingTop = "5px";

      if (PseudoEnvoi == pseudoJoueur) {
        node2.style.background = "#1260CC";
        node2.style.color = "white";
        node2.style.marginTop = "10px";
        node2.style.float = "right";
      } else {
        if (pseudoQuiNousDM != PseudoEnvoi) {
          document.getElementById("privateChat").appendChild(node3);
        }
        document.getElementById("privateChat").appendChild(node1);
        playSound(
          "https://cdn.glitch.global/d9fac2fb-dd5e-4283-800f-e504a6e4a40c/messageRecu.mp3?v=1666703414083"
        );
      }

      document.getElementById("privateChat").appendChild(node2);
      $("#pm_game").scrollTop($("#pm_game")[0].scrollHeight);
      pseudoQuiNousDM = PseudoRecu;
    }
  });

  socket.on("update_players", function (Datapseudo, Dataimage) {
    document.getElementById("mpChat").innerHTML = "";
    const pseudos = [...Datapseudo];
    const images = [...Dataimage];

    for (let i = 0; i < pseudos.length; i++) {
      let displayName = pseudos[i];
      if (displayName == pseudoJoueur) {
        displayName = "Vous(" + displayName + ")";
      }

      const node = document.createElement("li");
      node.textContent = displayName;
      node.style.fontSize = "x-large";
      node.style.margin = "auto";
      node.style.marginTop = "5px";

      const img = document.createElement("img");
      img.src = images[i];
      img.style.width = "72px";

      document.getElementById("mpChat").appendChild(img);
      document.getElementById("mpChat").appendChild(node);
    }
  });

  socket.on("updateNewMessage", function (NamePlayer, Message) {
    const node1 = document.createElement("li");
    const node2 = document.createElement("li");

    node1.textContent = NamePlayer;
    node1.style.marginTop = "10px";
    node1.style.color = "#ffb6c1";

    node2.textContent = Message;
    node2.style.color = "black";
    node2.style.background = "#ffb6c1";
    node2.style.borderRadius = "25px";
    node2.style.width = "max-content";
    node2.style.paddingLeft = "5px";
    node2.style.paddingRight = "5px";
    node2.style.fontSize = "20px";

    if (NamePlayer == pseudoJoueur) {
      node2.style.background = "#1260CC";
      node2.style.color = "white";
      node2.style.marginTop = "10px";
      node2.style.float = "right";
    } else {
      document.getElementById("mychat").appendChild(node1);
      playSound(
        "https://cdn.glitch.global/d9fac2fb-dd5e-4283-800f-e504a6e4a40c/messageEnvoi.mp3?v=1666703413833"
      );
    }

    document.getElementById("mychat").appendChild(node2);
    $("#all_game").scrollTop($("#all_game")[0].scrollHeight);
  });
}
