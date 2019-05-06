/******************************************************************************** 
 * 
 * 
 *
 *******************************************************************************/

// HTML document elements
const uPenny = document.getElementById("userPenny");
const lPenny = document.getElementById("learnerPenny");
const uScore = document.getElementById("userScore");
const lScore = document.getElementById("learnerScore");
const gameover = document.getElementById("gameover");
const user = document.getElementById("user");
const learner = document.getElementById("learner");

// Create learner and set scores to 0
const l = new Learner(3, 2, 0.5); // <-- rock, paper, scissors
let userScore = 0;
let learnerScore = 0;

// Display dummy pennies and starting progress bar
uPenny.setAttribute("src", "rock_dummy.jpg");
lPenny.setAttribute("src", "paper_dummy.jpg");
const userPB = new ProgressBar("user", "#008CBA");
const learnerPB = new ProgressBar("learner", "#ff471a");

function winningPrediction(action) {
  if (action == 0) return 1;
  if (action == 1) return 2;
  return 0;
}

window.onkeydown = function(e) {
  // Get keypress
  let action : number = 1;
  if (e.keyCode == 82) { action = 0; } // r = rock = 0
  else if (e.keyCode == 80) { action = 1; } // p = paper = 1
  else if (e.keyCode == 83) { action = 2; } // s = scissors = 2
  else { return; }

  // Hide labels
  user.style.display = "none";
  learner.style.display = "none";

  // Get learner prediction, observe user action
  const prediction = l.predict();
  l.observeAction(winningPrediction(action));

  // Display pennies
  if (action == 0)      { uPenny.setAttribute("src", "rock.jpg"); }
  else if (action == 1) { uPenny.setAttribute("src", "paper.jpg"); }
  else                  { uPenny.setAttribute("src", "scissors.jpg"); }

  if (prediction == 0)      { lPenny.setAttribute("src", "rock.jpg"); }
  else if (prediction == 1) { lPenny.setAttribute("src", "paper.jpg"); }
  else                      { lPenny.setAttribute("src", "scissors.jpg"); }

  // Display a score
  if (prediction == winningPrediction(action)) { 
    learnerScore++; 
    learnerPB.fill();
  } else if (action == winningPrediction(prediction)) { 
    userScore++;
    userPB.fill();
  }
  uScore.innerHTML = "" + userScore;
  lScore.innerHTML = "" + learnerScore;

  // Display "You won" or "Computer won" if game over
  if (Math.max(userScore, learnerScore) >= 100) {
    if (userScore > learnerScore) {
      gameover.innerHTML = "You won!";
      gameover.style.color = "#008CBA";
    } else {
      gameover.innerHTML = "The computer won!";
      gameover.style.color = "#ff471a";
    }

    // Display game over, ignore keypresses
    gameover.style.display = "block";
    window.onkeydown = function(e) {};
    uPenny.setAttribute("src", "rock_dummy.jpg");
    lPenny.setAttribute("src", "paper_dummy.jpg");
  }
}