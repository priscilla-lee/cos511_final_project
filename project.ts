// HTML document elements
uPenny = document.getElementById("userPenny")
lPenny = document.getElementById("learnerPenny")
uScore = document.getElementById("userScore")
lScore = document.getElementById("learnerScore")
gameover = document.getElementById("gameover")

// Create learner and set scores to 0
Learner l = new Learner();
userScore = 0;
learnerScore = 0;

// Display dummy pennies and starting progress bar
uPenny.src = "heads_dummy.jpg";
lPenny.src = "tails_dummy.jpg";
ProgressBar pb = new ProgressBar();

window.onkeydown = function(e) {
  // Get keypress
  action : number = 1;
  if (e.keyCode == 38) { // Up arrow
    action = 1; 
  } else if (e.keyCode == 40) { // Down arrow
    action = -1;
  } else {
    return;
  }

  // Add user action, get learner prediction
  l.addAction(action);
  prediction = l.predict();

  // Display pennies
  if (action == 1) { uPenny.src = "heads.jpg"; }
  else             { uPenny.src = "tails.jpg"; }

  if (prediction == 1) { lPenny.src = "heads.jpg"; }
  else                 { lPenny.src = "tails.jpg"; }

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
    uPenny.src = "heads_dummy.jpg";
    lPenny.src = "tails_dummy.jpg";
  }
}