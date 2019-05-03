// HTML document elements
const uPenny = document.getElementById("userPenny");
const lPenny = document.getElementById("learnerPenny");
const uScore = document.getElementById("userScore");
const lScore = document.getElementById("learnerScore");
const gameover = document.getElementById("gameover");
const user = document.getElementById("user");
const learner = document.getElementById("learner");

// Create learner and set scores to 0
const l = new Learner(2, 0.5, 3); // <-- matching pennies
let userScore = 0;
let learnerScore = 0;

// Display dummy pennies and starting progress bar
uPenny.setAttribute("src", "heads_dummy.jpg");
lPenny.setAttribute("src", "tails_dummy.jpg");
const userPB = new ProgressBar("user", "blue");
const learnerPB = new ProgressBar("learner", "red");

window.onkeydown = function(e) {
  // Hide labels
  user.style.display = "none";
  learner.style.display = "none";

  // Get keypress
  let action : number = 1;
  
  // if (e.keyCode == 48) { action = 0; }
  // else if (e.keyCode == 49) { action = 1; }
  // else if (e.keyCode == 50) { action = 2; }
  // else { return; }

  if (e.keyCode == 37) { action = 0; } // left = heads = 0
  else if (e.keyCode == 39) { action = 1; } // right = tails = 1
  else { return; }

  // Get learner prediction, observe user action
  const prediction = l.predict();
  l.addAction(action);
  console.log("prediction: " + prediction + ", action: " + action);

  // Display pennies
  if (action == 0) { uPenny.setAttribute("src", "heads.jpg"); }
  else             { uPenny.setAttribute("src", "tails.jpg"); }

  if (prediction == 0) { lPenny.setAttribute("src", "heads.jpg"); }
  else                 { lPenny.setAttribute("src", "tails.jpg"); }

  // Display a score
  if (prediction == action) { 
    learnerScore++; 
    lScore.style.color = "red";
    uScore.style.color = "black";
    learnerPB.fill();
  } else { 
    userScore++;
    lScore.style.color = "black";
    uScore.style.color = "blue"; 
    userPB.fill();
  }
  uScore.innerHTML = "" + userScore;
  lScore.innerHTML = "" + learnerScore;

  // Display "You won" or "Computer won" if game over
  if (Math.max(userScore, learnerScore) >= 100) {
    if (userScore > learnerScore) {
      gameover.innerHTML = "You won!";
      gameover.style.color = "blue";
    } else {
      gameover.innerHTML = "The computer won!";
      gameover.style.color = "red";
    }

    // Display game over, ignore keypresses
    gameover.style.display = "block";
    window.onkeydown = function(e) {};
    uPenny.setAttribute("src", "heads_dummy.jpg");
    lPenny.setAttribute("src", "tails_dummy.jpg");
  }
}