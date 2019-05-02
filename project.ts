// HTML document elements
const uPenny = document.getElementById("userPenny");
const lPenny = document.getElementById("learnerPenny");
const uScore = document.getElementById("userScore");
const lScore = document.getElementById("learnerScore");
const gameover = document.getElementById("gameover");

// Create learner and set scores to 0
const l = new Learner(2);
let userScore = 0;
let learnerScore = 0;

// Display dummy pennies and starting progress bar
uPenny.setAttribute("src", "heads_dummy.jpg");
lPenny.setAttribute("src", "tails_dummy.jpg");
const pb = new ProgressBar();

window.onkeydown = function(e) {
  // Get keypress
  let action : number = 1;
  if (e.keyCode == 38) { // Up arrow
    action = 1; 
  } else if (e.keyCode == 40) { // Down arrow
    action = -1;
  } else {
    return;
  }

  // Add user action, get learner prediction
  const prediction = l.predict();
  l.addAction(action);

  // Display pennies
  if (action == 1) { uPenny.setAttribute("src", "heads.jpg"); }
  else             { uPenny.setAttribute("src", "tails.jpg"); }

  if (prediction == 1) { lPenny.setAttribute("src", "heads.jpg"); }
  else                 { lPenny.setAttribute("src", "tails.jpg"); }

  // Display a score
  if (prediction == action) { 
    learnerScore++; 
    lScore.style.color = "red";
    uScore.style.color = "black";
    pb.learnerWins();
  } else { 
    userScore++;
    lScore.style.color = "black";
    uScore.style.color = "blue"; 
    pb.userWins();
  }
  uScore.innerHTML = "User score: " + userScore;
  lScore.innerHTML = "Learner score: " + learnerScore;

  // Display "You won" or "Computer won" if game over
  if (Math.abs(userScore - learnerScore) >= 10) {
    if (userScore > learnerScore) {
      gameover.innerHTML = "You won!";
      gameover.style.color = "blue";
    } else {
      gameover.innerHTML = "The computer won!";
      gameover.style.color = "red";
    }

    gameover.style.display = "block";
    window.onkeydown = function(e) {};
    uPenny.setAttribute("src", "heads_dummy.jpg");
    lPenny.setAttribute("src", "tails_dummy.jpg");
  }
}