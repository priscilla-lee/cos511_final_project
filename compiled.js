var ProgressBar = /** @class */ (function () {
    function ProgressBar(POV, color) {
        var canvas = document.getElementById(POV + "Canvas");
        canvas.height = 100;
        canvas.width = 100;
        this.ctx = canvas.getContext("2d");
        this.ctx.fillStyle = color;
        this.bar = 0;
    }
    ProgressBar.prototype.fill = function () {
        this.ctx.fillRect(this.bar, 0, 1, 100);
        this.bar++;
    };
    return ProgressBar;
}());
var Expert = /** @class */ (function () {
    // Construct expert i
    function Expert(i) {
        this.number = i; // col number
        this.predictions = i.toString(2); // binary
        while (this.predictions.length < 8) {
            this.predictions = "0" + this.predictions;
        }
    }
    // Prediction of expert i given history (e.g. "101")
    Expert.prototype.predict = function (history) {
        var row = parseInt(history, 2); // row number
        return parseInt(this.predictions[row]);
    };
    return Expert;
}());
var Learner = /** @class */ (function () {
    // Constructor: store actions, predictions, weights, and p's
    function Learner(num, eta) {
        this.actions = [];
        this.predictions = [];
        this.weights = [];
        this.probability = [];
        this.eta = eta;
        // init w = (1, 1) and p = (1/2, 1/2)
        for (var i = 0; i < num; i++) {
            this.weights.push(1); // 1 for MW, 0 for simple algorithm
            this.probability.push(0.5);
        }
        // distribution Pt that we are learning
        this.Pt = [];
        for (var i = 0; i < 256; i++) {
            this.Pt.push(1 / 256);
        }
        // set up 255 experts (using history h = 3)
        this.experts = [];
        for (var i = 0; i < 256; i++) {
            this.experts.push(new Expert(i));
        }
    }
    // Predict according to algorithm
    Learner.prototype.predict = function () {
        var p = this._predictExpertly();
        this.predictions.push(p);
        console.log("     user: " + this.actions);
        console.log("  learner: " + this.predictions);
        console.log("  weights: " + this.weights);
        return p;
    };
    // Observe user action, update weights
    Learner.prototype.addAction = function (action) {
        this._updateExpertWeights(action);
        this.actions.push(action);
        console.log("updated p: " + this.probability);
        console.log("");
    };
    // Reward: 1 if same, -1 if different/mistake
    Learner.prototype._reward = function (action, prediction) {
        if (action == prediction)
            return 1;
        else
            return -1;
    };
    /* -------------------------------------------------------
                        Updating algorithms
    ------------------------------------------------------- */
    // Simple algorithm: counts and proportions
    Learner.prototype._updateSimple = function (action) {
        // update weights vector
        this.weights[action]++;
        // update probability vector
        var sum = this.weights.reduce(function (a, b) { return a + b; }, 0);
        this.probability = this.weights.map(function (w) { return w / sum; });
    };
    // Weighted majority algorithm: page 156 in textbook
    /* Early machines for learning to play penny-matching, as in section 6.5,
    were invented by Hagelbarger [115] and later by Shannon [213]. Figure 6.3
    is reprinted from the former. The technique of combining the predictions
    of all possible context trees is due to Helmbold and Schapire [122], in a
    direct adaptation of Willems, Shtarkov, and Tjalkens’s method for weighting
    context trees [231]. The Internet implementation was created by the authors
    with Anup Doshi. */
    // [115] D. W. Hagelbarger. SEER, A SEquence Extrapolating Robot. IRE Transactions on Electronic Computers , EC-5(1):1– 7, March 1956.
    // [122] David P. Helmbold and Robert E. Schapire. Predicting nearly as well as the best pruning of a decision tree. Machine Learning , 27(1):51– 68, April 1997.
    // [213] Claude E. Shannon. A mind-reading (?) machine. Technical report, Bell Laboratories, 1953.
    // [231] Frans M. J. Willems, Yuri M. Shtarkov, and Tjalling J. Tjalkens. The context tree weighting method: Basic properties. IEEE Transactions on Information Theory , 41(3):653– 664, 1995.
    Learner.prototype._updateExpertWeights = function (action) {
        // If we don't have enough history, ignore
        if (this.actions.length < 3) {
            return;
        }
        // Get 3 most recent actions (history)
        var history = this.actions.join("").substring(this.actions.length - 3);
        // Update Pt according to which experts would've predicted the action correctly
        // i.e. (only) penalize experts that made mistakes
        for (var i = 0; i < this.Pt.length; i++) {
            if (this.experts[i].predict(history) != action) { // mistake!
                this.Pt[i] = this.Pt[i] * Math.pow(Math.E, -this.eta);
            }
        }
        // Finally, normalize Pt
        this.Pt = this._normalize(this.Pt);
    };
    // Multiplicative weights algorithm: update rule
    Learner.prototype._updateMW = function (action) {
        // update weights vector
        this.weights[0] *= (1 + this.eta * this._reward(action, 0));
        this.weights[1] *= (1 + this.eta * this._reward(action, 1));
        // update probability vector
        this.probability = this._normalize(this.weights);
    };
    /* -------------------------------------------------------
                        Prediction algorithms
    ------------------------------------------------------- */
    // Expert prediction: choose prediction of expert according to Pt
    Learner.prototype._predictExpertly = function () {
        // If we don't have enough history, just predict randomly
        if (this.actions.length < 3) {
            return this._predictRandomly();
        }
        // Choose expert randomly (according to Pt)
        var index = this._discrete(this.Pt);
        var expert = this.experts[index];
        // Get 3 most recent actions (history)
        var history = this.actions.join("").substring(this.actions.length - 3);
        // Return the prediction of the chosen expert, given the history
        return expert.predict(history);
    };
    // Simple prediction: predict according to probability
    Learner.prototype._predictProbabilistically = function () {
        return +!(Math.random() < this.probability[0]);
    };
    // Stupid prediction: predict action with higher probability
    Learner.prototype._predictDeterministically = function () {
        return +!(this.probability[0] > this.probability[1]);
    };
    // Random prediction: 1/2 heads, 1/2 tails
    Learner.prototype._predictRandomly = function () {
        return +!(Math.random() < 0.5); // true --> 0, false --> 1
    };
    /* -------------------------------------------------------
          Helper functions with probability distributions
    ------------------------------------------------------- */
    // Randomly choose an index given array of probabilities
    Learner.prototype._discrete = function (probabilities) {
        // Step 0: make a defensive copy!
        var copy = [];
        for (var i = 0; i < probabilities.length; i++) {
            copy.push(probabilities[i]);
        }
        // Step 1: cumulative sum
        var sum = 0;
        for (var i = 0; i < copy.length; i++) {
            sum += copy[i];
            copy[i] = sum;
        }
        // Step 2: choose a random index
        var rand = Math.random();
        for (var i = 0; i < copy.length; i++) {
            if (rand < copy[i]) {
                return i;
            }
        }
        return copy.length - 1;
    };
    // Normalize an input array of numbers (sum to 1)
    Learner.prototype._normalize = function (probabilities) {
        var sum = probabilities.reduce(function (a, b) { return a + b; }, 0);
        return probabilities.map(function (p) { return p / sum; });
    };
    return Learner;
}());
// HTML document elements
var uPenny = document.getElementById("userPenny");
var lPenny = document.getElementById("learnerPenny");
var uScore = document.getElementById("userScore");
var lScore = document.getElementById("learnerScore");
var gameover = document.getElementById("gameover");
var user = document.getElementById("user");
var learner = document.getElementById("learner");
// Create learner and set scores to 0
var l = new Learner(2, 0.5);
var userScore = 0;
var learnerScore = 0;
// Display dummy pennies and starting progress bar
uPenny.setAttribute("src", "heads_dummy.jpg");
lPenny.setAttribute("src", "tails_dummy.jpg");
var userPB = new ProgressBar("user", "blue");
var learnerPB = new ProgressBar("learner", "red");
window.onkeydown = function (e) {
    // Hide labels
    user.style.display = "none";
    learner.style.display = "none";
    // Get keypress
    var action = 1;
    if (e.keyCode == 37) { // Left arrow (heads)
        action = 0;
    }
    else if (e.keyCode == 39) { // Right arrow (tails)
        action = 1;
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
        learnerPB.fill();
    }
    else {
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
