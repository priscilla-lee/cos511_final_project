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
    // Constructor: store actions, predictions, weights, and p's
    function Learner(num) {
        this.actions = [];
        this.predictions = [];
        this.weights = [];
        this.probability = [];
        // init w = (0, 0) and p = (1/2, 1/2)
        for (var i = 0; i < num; i++) {
            this.weights.push(0);
            this.probability.push(0.5);
        }
    }
    // Observe user action, update weights
    Learner.prototype.addAction = function (action) {
        this.actions.push(action);
        this._updateSimple(action);
        console.log("updated p: " + this.probability);
        console.log("");
    };
    // Predict according to algorithm
    Learner.prototype.predict = function () {
        var p = this._predictStupid();
        this.predictions.push(p);
        console.log("     user: " + this.actions);
        console.log("  learner: " + this.predictions);
        console.log("  weights: " + this.weights);
        return p;
    };
    // Simple: counts and proportions
    Learner.prototype._updateSimple = function (action) {
        // update weights vector
        this.weights[action]++;
        // update probability vector
        var sum = this.weights.reduce(function (a, b) { return a + b; }, 0);
        this.probability = this.weights.map(function (w) { return w / sum; });
    };
    // Simple: predict according to probability
    Learner.prototype._predictSimple = function () {
        return +!(Math.random() < this.probability[0]);
    };
    // Stupid: predict action with higher probability
    Learner.prototype._predictStupid = function () {
        return +!(this.probability[0] > this.probability[1]);
    };
    // Random: completely random 1/2 heads, 1/2 tails
    Learner.prototype._predictRandom = function () {
        return +!(Math.random() < 0.5); // true --> 0, false --> 1
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
var l = new Learner(2);
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
        action = 0; // heads
    }
    else if (e.keyCode == 40) { // Down arrow
        action = 1; // tails
    }
    else {
        return;
    }
    // Get learner prediction, observe user action
    var prediction = l.predict();
    l.addAction(action);
    // Display pennies
    if (action == 0) {
        uPenny.setAttribute("src", "heads.jpg");
    }
    else {
        uPenny.setAttribute("src", "tails.jpg");
    }
    if (prediction == 0) {
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
