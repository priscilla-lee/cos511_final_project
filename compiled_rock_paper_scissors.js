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
    function Expert(i, n_actions, history_length) {
        this.num_actions = n_actions;
        this.number = i; // col number
        this.predictions = i.toString(n_actions);
        while (this.predictions.length < Math.pow(n_actions, history_length)) {
            this.predictions = "0" + this.predictions;
        }
    }
    // Prediction of expert i given history (e.g. "101")
    Expert.prototype.predict = function (history) {
        var row = parseInt(history, this.num_actions);
        return parseInt(this.predictions[row]);
    };
    return Expert;
}());
var Learner = /** @class */ (function () {
    // Constructor: store actions, predictions, weights, and p's
    function Learner(num_actions, eta, history_length) {
        this.actions = [];
        this.predictions = [];
        this.eta = eta;
        // (Option 1) 2 experts
        this.weights = [];
        this.probability = [];
        for (var i = 0; i < num_actions; i++) {
            this.weights.push(1);
            this.probability.push(1 / num_actions); // uniform probability
        }
        // (Option 2) 256 (or 19683) experts with context trees
        var num_experts = Math.pow(num_actions, Math.pow(num_actions, history_length));
        this.h = history_length;
        this.experts = [];
        this.Pt = [];
        for (var i = 0; i < num_experts; i++) {
            this.experts.push(new Expert(i, num_actions, history_length));
            this.Pt.push(1 / num_experts); // uniform probability
        }
    }
    // Predict according to algorithm
    Learner.prototype.predict = function () {
        var p = /*Option 2*/ this._predictExpertly();
        // = /*Option 1*/ this._predictProbabilistically();
        this.predictions.push(p);
        // console.log("     user: " + this.actions);
        // console.log("  learner: " + this.predictions);
        // console.log("  weights: " + this.weights);
        return p;
    };
    // Observe user action, update weights
    Learner.prototype.addAction = function (action) {
        /*Option 2*/ this._updateExpertWeights(action);
        //Option 1   this._updateMultiplicativeWeights(action);
        this.actions.push(action);
        // console.log("updated p: " + this.probability);
        // console.log("");
    };
    /* -------------------------------------------------------
                        Updating algorithms
    ------------------------------------------------------- */
    // Multiplicative weights with context tree experts (page 156 in textbook)
    Learner.prototype._updateExpertWeights = function (action) {
        // If we don't have enough history, ignore
        if (this.actions.length < this.h) {
            return;
        }
        // Get h most recent actions (history)
        var history = this.actions.join("").substring(this.actions.length - this.h);
        // Update Pt: (only) penalize experts that made mistakes
        for (var i = 0; i < this.Pt.length; i++) {
            if (this.experts[i].predict(history) != action) {
                // bigger eta --> harsher penalty
                this.Pt[i] = this.Pt[i] * Math.pow(Math.E, -this.eta);
            }
        }
        // Finally, normalize Pt
        this.Pt = this._normalize(this.Pt);
    };
    // Multiplicative weights algorithm: update rule
    Learner.prototype._updateMultiplicativeWeights = function (action) {
        // update weights vector
        this.weights[0] *= (1 + this.eta * this._reward(action, 0));
        this.weights[1] *= (1 + this.eta * this._reward(action, 1));
        // update probability vector
        this.probability = this._normalize(this.weights);
    };
    // Simple algorithm: counts and proportions
    Learner.prototype._updateCounts = function (action) {
        this.weights[action]++;
        this.probability = this._normalize(this.weights);
    };
    /* -------------------------------------------------------
                        Prediction algorithms
    ------------------------------------------------------- */
    // Expert prediction: choose prediction of expert according to Pt
    Learner.prototype._predictExpertly = function () {
        // If we don't have enough history, just predict randomly
        if (this.actions.length < this.h) {
            return this._predictRandomly();
        }
        // Choose expert randomly (according to Pt)
        var index = this._discrete(this.Pt);
        var expert = this.experts[index];
        // Get h most recent actions (history)
        var history = this.actions.join("").substring(this.actions.length - this.h);
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
          Helper functions (with probability distributions)
    ------------------------------------------------------- */
    // Reward: 1 if same, -1 if different/mistake
    Learner.prototype._reward = function (action, prediction) {
        if (action == prediction)
            return 1;
        else
            return -1;
    };
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
var l = new Learner(3, 0.5, 2); // <-- rock, paper, scissors
var userScore = 0;
var learnerScore = 0;
// Display dummy pennies and starting progress bar
uPenny.setAttribute("src", "rock_dummy.jpg");
lPenny.setAttribute("src", "paper_dummy.jpg");
var userPB = new ProgressBar("user", "#008CBA");
var learnerPB = new ProgressBar("learner", "#ff471a");
function winningPrediction(action) {
    if (action == 0)
        return 1;
    if (action == 1)
        return 2;
    return 0;
}
window.onkeydown = function (e) {
    // Get keypress
    var action = 1;
    if (e.keyCode == 82) {
        action = 0;
    } // r = rock = 0
    else if (e.keyCode == 80) {
        action = 1;
    } // p = paper = 1
    else if (e.keyCode == 83) {
        action = 2;
    } // s = scissors = 2
    else {
        return;
    }
    // Hide labels
    user.style.display = "none";
    learner.style.display = "none";
    // Get learner prediction, observe user action
    var prediction = l.predict();
    l.addAction(winningPrediction(action));
    // Display pennies
    if (action == 0) {
        uPenny.setAttribute("src", "rock.jpg");
    }
    else if (action == 1) {
        uPenny.setAttribute("src", "paper.jpg");
    }
    else {
        uPenny.setAttribute("src", "scissors.jpg");
    }
    if (prediction == 0) {
        lPenny.setAttribute("src", "rock.jpg");
    }
    else if (prediction == 1) {
        lPenny.setAttribute("src", "paper.jpg");
    }
    else {
        lPenny.setAttribute("src", "scissors.jpg");
    }
    // Display a score
    if (prediction == winningPrediction(action)) {
        learnerScore++;
        learnerPB.fill();
    }
    else if (action == winningPrediction(prediction)) {
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
        }
        else {
            gameover.innerHTML = "The computer won!";
            gameover.style.color = "#ff471a";
        }
        // Display game over, ignore keypresses
        gameover.style.display = "block";
        window.onkeydown = function (e) { };
        uPenny.setAttribute("src", "rock_dummy.jpg");
        lPenny.setAttribute("src", "paper_dummy.jpg");
    }
};
var Experiment = /** @class */ (function () {
    function Experiment(num_actions, history_length) {
        this.num_actions = num_actions;
        this.history_length = history_length;
    }
    Experiment.prototype.run = function (eta, input) {
        var learner = new Learner(this.num_actions, eta, this.history_length);
        var userScore = 0;
        var learnerScore = 0;
        for (var i = 0; i < input.length; i++) {
            var a = parseInt(input[i]);
            var p = learner.predict();
            if (p == a) {
                learnerScore++;
            }
            else {
                userScore++;
            }
            if (Math.max(userScore, learnerScore) >= 100) {
                return [userScore, learnerScore];
            }
            learner.addAction(a);
        }
    };
    Experiment.prototype.runRepeatedly = function (eta, input, count) {
        var results = [];
        for (var i = 0; i < count; i++) {
            results.push(this.run(eta, input));
        }
        return results;
    };
    Experiment.prototype.runAverage = function (eta, input, count) {
        var results = this.runRepeatedly(eta, input, count);
        var userSum = 0;
        var learnerSum = 0;
        for (var i = 0; i < results.length; i++) {
            userSum += results[i][0];
            learnerSum += results[i][1];
        }
        return [userSum / results.length, learnerSum / results.length];
    };
    Experiment.prototype.outputResults = function (eta_lo, eta_high, eta_step, input, count) {
        // List etas
        var etas = [];
        for (var i = eta_lo; i < eta_high; i += eta_step) {
            etas.push(i);
        }
        var userScores = [];
        var learnerScores = [];
        // Run all those experiments
        for (var i = 0; i < etas.length; i++) {
            var results = this.runAverage(etas[i], input, count);
            userScores.push(results[0]);
            learnerScores.push(results[1]);
        }
        return [etas, userScores, learnerScores];
    };
    Experiment.generatePattern = function (pattern) {
        var result = "";
        while (result.length < 200) {
            result += pattern;
        }
        return result;
    };
    Experiment.prototype.generateAdversary = function () {
        var table = {};
        var num_experts = Math.pow(this.num_actions, this.history_length);
        // Put in empty arrays in each row (all possible histories)
        for (var i = 0; i < num_experts; i++) {
            // Generate key (a possible history)
            var key = i.toString(this.num_actions);
            while (key.length < this.history_length) {
                key = "0" + key;
            }
            // Add the initial counts (0) to the table
            table[key] = [];
            for (var i_1 = 0; i_1 < this.num_actions; i_1++) {
                table[key].push(0);
            }
        }
        // Set up (initial history, resulting adversarial string)
        var adversary = "";
        var history = "";
        for (var i = 0; i < this.history_length; i++) {
            adversary += "0";
            history += "0";
        }
        // Add an action one at a time
        while (adversary.length < 200) {
            // Choose an action from our options
            var options = table[history];
            var action = Experiment._getMinIndex(options);
            // Increment appropriate cell in table
            table[history][action]++;
            // Update adversarial pattern and the history
            adversary += action;
            history = history.substring(1) + action;
        }
        return adversary;
    };
    Experiment._getMinIndex = function (array) {
        var min = array[0];
        var minIndex = 0;
        for (var i = 0; i < array.length; i++) {
            if (array[i] < min) {
                min = array[i];
                minIndex = i;
            }
        }
        return minIndex;
    };
    return Experiment;
}());
