import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

const resultOverlay = document.getElementById("result-overlay");
const resultIcon = document.getElementById("result-icon");

const firebaseConfig = {
  apiKey: "AIzaSyBwGgvtyEzA_SvpFnTf867yP1WTZReDcdI",
  authDomain: "thinkeval.firebaseapp.com",
  projectId: "thinkeval",
  storageBucket: "thinkeval.appspot.com",
  messagingSenderId: "348522791964",
  appId: "1:348522791964:web:e53e677e9eb550a3b74bd9",
  measurementId: "G-ELDBL548WP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const generate = document.getElementById("generate")
const board = document.getElementById("board")
const send = document.getElementById("send")
const good = document.getElementById("good")
const bad = document.getElementById("bad")

let selected = []
let game = []
let gameID = -1
let method = ""

generate.addEventListener("click", async () => {
    board.innerHTML = "";
    selected = []

    const response = await fetch("exp.json")
    const games = await response.json()

    game = games[Math.floor(Math.random() * games.length)];

    loadGame(game)
    good.disabled = false
    bad.disabled = false

    const message = document.getElementById("message");
    message.textContent = "Select 4 words that belong to the same category";
    message.className = "message";

    hideResultOverlay();
})

send.addEventListener("click", async () => {
    if (selected.length == 4) {
        let highest = 0
        const selectedWords = selected.map(tile => tile.textContent);
        const message = document.getElementById("message")
        for (const category in game) {
            if (category == "id" || category == "method") {
              continue
            }
            let currGroupings = 0
            for (const word of game[category]) {
                if (selectedWords.includes(word)) {
                    currGroupings++;
                }
            }
            highest = Math.max(highest, currGroupings)

            if (currGroupings == 4) {
                selected.forEach(tile => {
                    tile.classList.remove("selected");
                    tile.classList.add("correct");
                  });
                  selected = [];
                  
                  message.textContent = `Correct! Category: ${category}`
                  message.className = "message success";

                  showSuccessOverlay();
                  createConfetti();

                  return;
            }
        }
        message.textContent = `You were ${4 - highest} word(s) away.`
        message.className = "message error";
        showErrorOverlay();
    }
})

good.addEventListener("click", async () => {
    const modelRef = doc(db, "PuzzleEvaluation", String(gameID));
    const modelSnap = await getDoc(modelRef);

    let goodCount = 0
    let totalCount = 0
    if (modelSnap.exists()) {
      const data = modelSnap.data()
      goodCount = data.good || 0;
      totalCount = data.total || 0
    } else {
      await setDoc(modelRef, { good: 0, total: 0, method: method});
    }
  
    await updateDoc(modelRef, {
      good: goodCount + 1,
      total: totalCount + 1,
    });

    good.disabled = true
    bad.disabled = true
  
  });


bad.addEventListener("click", async () => {
  const modelRef = doc(db, "PuzzleEvaluation", String(gameID));
  const modelSnap = await getDoc(modelRef);

  let totalCount = 0
  if (modelSnap.exists()) {
    const data = modelSnap.data()
    totalCount = data.total || 0
  } else {
    await setDoc(modelRef, { good: 0, total: 0, method: method});
  }

  await updateDoc(modelRef, {
    total: totalCount + 1,
  });

  good.disabled = true
  bad.disabled = true

});

function loadGame(game) {
    let randomized = [];
    for (const category in game) {
      if (category == "id") {
        gameID = game[category]
      }
      else if (category == "method") {
        method = game["method"]
      }
      else {
        randomized.push(...game[category])
      }
    }
    randomized = shuffle(randomized);

    for (const word of randomized) {
        const tile = document.createElement("div")
        tile.className = 'word-tile-game'
        tile.textContent = word
        tile.onclick = () => {
            toggleSelection(tile)
        }
        board.appendChild(tile)
    }
    
    const message = document.getElementById("message");
    message.className = "message";
    message.textContent = "Select 4 words that belong to the same category";
  
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function toggleSelection(tile) {
    if (!tile.classList.contains("selected") && selected.length < 4) {
        tile.classList.add("selected");
        selected.push(tile);
    } else if (tile.classList.contains("selected")) {
        tile.classList.remove("selected");
        selected = selected.filter(t => t !== tile);
    }
}

function showSuccessOverlay() {
  resultIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
  resultIcon.className = "result-icon success";
  resultOverlay.className = "result-overlay success visible";

  setTimeout(() => {
      hideResultOverlay();
  }, 1500);
}

function showErrorOverlay() {
  resultIcon.innerHTML = '<i class="fas fa-times"></i>';
  resultIcon.className = "result-icon error";
  resultOverlay.className = "result-overlay error visible";
  
  setTimeout(() => {
      hideResultOverlay();
  }, 1500);
}

function hideResultOverlay() {
    resultOverlay.className = "result-overlay";
}

function createConfetti() {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
  const container = document.querySelector('body');

  for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      

      const size = Math.random() * 10 + 5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size}px`;
      confetti.style.backgroundColor = color;
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.top = `-20px`;
      
      container.appendChild(confetti);
      

      const animation = confetti.animate(
          [
              { 
                  transform: `translate(0, 0) rotate(0deg)`,
                  opacity: 1
              },
              { 
                  transform: `translate(${Math.random() * 200 - 100}px, ${Math.random() * 500 + 500}px) rotate(${Math.random() * 360}deg)`,
                  opacity: 0
              }
          ],
          {
              duration: Math.random() * 2000 + 1500,
              easing: 'cubic-bezier(0.1, 0.8, 0.9, 0.2)'
          }
      );
      

      animation.onfinish = () => {
          confetti.remove();
      };
  }
}
