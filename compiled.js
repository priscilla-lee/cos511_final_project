var ProgressBar = /** @class */ (function () {
    function ProgressBar() {
        var canvas = document.getElementById("canvas");
        canvas.height = 100;
        canvas.width = 200;
        // Draw center line
        this.ctx = canvas.getContext("2d");
        this.drawCenterLine();
        this.bar = 100;
    }
    ProgressBar.prototype.drawCenterLine = function () {
        this.ctx.lineWidth = 0.5;
        this.ctx.moveTo(100.5, 0);
        this.ctx.lineTo(100.5, 100);
        this.ctx.stroke();
    };
    ProgressBar.prototype.userWins = function () {
        this.bar = this.bar - 10;
        if (this.bar < 100) {
            this.ctx.fillStyle = "blue";
        }
        else {
            this.ctx.fillStyle = "white";
        }
        this.ctx.fillRect(this.bar, 0, 10, 100);
        this.drawCenterLine();
    };
    ProgressBar.prototype.learnerWins = function () {
        this.bar = this.bar + 10;
        if (this.bar > 100) {
            this.ctx.fillStyle = "red";
        }
        else {
            this.ctx.fillStyle = "white";
        }
        this.ctx.fillRect(this.bar - 10, 0, 10, 100);
        this.drawCenterLine();
    };
    return ProgressBar;
}());
var Learner = /** @class */ (function () {
    function Learner() {
        this.actions = [];
        this.predictions = [];
    }
    Learner.prototype.addAction = function (action) {
        this.actions.push(action);
    };
    Learner.prototype.predict = function () {
        var p = 1;
        if (Math.random() < 0.5) {
            p = -1;
        }
        this.predictions.push(p);
        return p;
    };
    return Learner;
}());
// HTML document elements
var uPenny = document.getElementById("userPenny");
var lPenny = document.getElementById("learnerPenny");
var uScore = document.getElementById("userScore");
var lScore = document.getElementById("learnerScore");
var gameover = document.getElementById("gameover");
// Create learner and set scores to 0
var l = new Learner();
var userScore = 0;
var learnerScore = 0;
// Display dummy pennies and starting progress bar
uPenny.setAttribute("src", "heads_dummy.jpg");
lPenny.setAttribute("src", "tails_dummy.jpg");
var pb = new ProgressBar();
window.onkeydown = function (e) {
    // Get keypress
    var action = 1;
    if (e.keyCode == 38) { // Up arrow
        action = 1;
    }
    else if (e.keyCode == 40) { // Down arrow
        action = -1;
    }
    else {
        return;
    }
    // Add user action, get learner prediction
    l.addAction(action);
    var prediction = l.predict();
    // Display pennies
    if (action == 1) {
        uPenny.setAttribute("src", "heads.jpg");
    }
    else {
        uPenny.setAttribute("src", "tails.jpg");
    }
    if (prediction == 1) {
        lPenny.setAttribute("src", "heads.jpg");
    }
    else {
        lPenny.setAttribute("src", "tails.jpg");
    }
    // Display a score
    if (prediction == action) {
        learnerScore++;
        lScore.style.color = "red";
        uScore.style.color = "black";
        pb.learnerWins();
    }
    else {
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
        }
        else {
            gameover.innerHTML = "The computer won!";
            gameover.style.color = "red";
        }
        gameover.style.display = "block";
        window.onkeydown = function (e) { };
        uPenny.setAttribute("src", "heads_dummy.jpg");
        lPenny.setAttribute("src", "tails_dummy.jpg");
    }
};
