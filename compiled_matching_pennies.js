/********************************************************************************
 * Expert: Implements a context-tree expert (a decision tree based on context).
 *         Represents each expert as an n-ary string (labelings for leaves).
 *******************************************************************************/
var Expert = /** @class */ (function () {
    // Construct expert i (context-tree with n^h leaves)
    function Expert(i, n, h) {
        this.n = n;
        this.number = i; // col number
        this.predictions = i.toString(n);
        while (this.predictions.length < Math.pow(n, h)) {
            this.predictions = "0" + this.predictions;
        }
    }
    // Prediction of expert i given history (e.g. "101")
    Expert.prototype.predict = function (history) {
        var row = parseInt(history, this.n);
        return parseInt(this.predictions[row]);
    };
    return Expert;
}());
/********************************************************************************
 * Learner: Implements the multiplicative weights algorithm.
 *          Can predict actions, observe actions, and update weights.
 *          Generalizes to n-strategy games, using context-trees with history h.
 *******************************************************************************/
var Learner = /** @class */ (function () {
    // Constructor: number of actions (n), history/context length (h), learning rate (eta)
    function Learner(n, h, eta) {
        this.actions = [];
        this.predictions = [];
        this.n = n;
        this.h = h;
        this.eta = eta;
        this.experts = [];
        this.weights = [];
        // Enumerate experts and set uniform weights
        var num_experts = Math.pow(n, Math.pow(n, h)); // e.g. 256 (or 19683)
        for (var i = 0; i < num_experts; i++) {
            this.experts.push(new Expert(i, n, h));
            this.weights.push(1 / num_experts); // uniform probability
        }
        // Construct uniform weights (pre-computed for computational efficiency)
        this._uniform = [];
        for (var i = 0; i < this.n; i++) {
            this._uniform.push(1);
        }
    }
    // Helper method to get the history (h most recent actions)
    Learner.prototype._getHistory = function () {
        return this.actions.join("").substring(this.actions.length - this.h);
    };
    // Predict according to weighted context-tree experts
    Learner.prototype.predict = function () {
        // Predict completely randomly if not enough history
        var p = this._predictRandomly();
        // If enough history, predict based on weighted experts
        if (this.actions.length >= this.h) {
            // Choose expert randomly (according to weights)
            var index = this._discrete(this.weights);
            var expert = this.experts[index];
            // Return the prediction of the chosen expert, given the history
            p = expert.predict(this._getHistory());
        }
        // Add to list of learner predictions
        this.predictions.push(p);
        return p;
    };
    // Observe user action, and update weights according to the 
    // multiplicative weights algorithm (page 156 in textbook)
    Learner.prototype.observeAction = function (action) {
        // Update weights (only) if we have enough history
        if (this.actions.length >= this.h) {
            // Update weights: (only) penalize experts that made mistakes
            for (var i = 0; i < this.weights.length; i++) {
                if (this.experts[i].predict(this._getHistory()) != action) {
                    // bigger eta --> harsher penalty
                    this.weights[i] = this.weights[i] * Math.pow(Math.E, -this.eta);
                }
            }
            // Finally, normalize weights
            this.weights = this._normalize(this.weights);
        }
        // Add to list of user actions
        this.actions.push(action);
    };
    // Get the learner's current probabilities of s
    Learner.prototype.getActionProbabilities = function (history) {
        var probs = [];
        for (var i = 0; i < this.n; i++) {
            probs.push(0);
        }
        // Sum up probabilities (across experts who would've predicted that action)
        for (var i = 0; i < this.experts.length; i++) {
            var e = this.experts[i];
            probs[e.predict(history)] += this.weights[i];
        }
        return probs;
    };
    // Random prediction: uniformly (e.g. 1/2 heads, 1/2 tails)
    Learner.prototype._predictRandomly = function () {
        return this._discrete(this._uniform);
    };
    // Randomly choose an index given array of probabilities
    Learner.prototype._discrete = function (weights) {
        // Get probability distribution p
        var p = this._normalize(weights);
        // Step 1: cumulative sum
        var sum = 0;
        for (var i = 0; i < p.length; i++) {
            sum += p[i];
            p[i] = sum;
        }
        // Step 2: choose a random index
        var rand = Math.random();
        for (var i = 0; i < p.length; i++) {
            if (rand < p[i]) {
                return i;
            }
        }
        return p.length - 1;
    };
    // Normalize array to a probability distribution (sum to 1)
    Learner.prototype._normalize = function (weights) {
        var sum = weights.reduce(function (a, b) { return a + b; }, 0);
        return weights.map(function (p) { return p / sum; });
    };
    return Learner;
}());
/********************************************************************************
 * Experiment: Simulates game given adversary input (allows varying etas).
 * 						 Generates predictable input and worst-case adversarial input.
 *******************************************************************************/
var Experiment = /** @class */ (function () {
    // Experiment for an n-strategy game, using context trees of given depth h
    function Experiment(n, h) {
        this.n = n;
        this.h = h;
    }
    // Run a single experiment
    Experiment.prototype.runSingle = function (eta, input) {
        var learner = new Learner(this.n, this.h, eta);
        var userScore = 0;
        var learnerScore = 0;
        // Play each round until someone wins
        for (var i = 0; i < input.length; i++) {
            var p = learner.predict(); // Predict
            var a = parseInt(input[i]); // Observe user action
            if (p == a) {
                learnerScore++;
            }
            else {
                userScore++;
            }
            // After someone wins, return both resulting scores
            if (Math.max(userScore, learnerScore) >= 100) {
                return [userScore, learnerScore];
            }
            learner.observeAction(a);
        }
    };
    // Run experiments repeatedly, then average the user and learner scores
    Experiment.prototype.runAverage = function (eta, input, count) {
        var userSum = 0;
        var learnerSum = 0;
        // Run experiments <count> times
        for (var i = 0; i < count; i++) {
            var scores = this.runSingle(eta, input);
            userSum += scores[0];
            learnerSum += scores[1];
        }
        return [userSum / count, learnerSum / count];
    };
    // Return expected final scores when simulating play against adversary
    Experiment.prototype.simulate = function (eta, input, verbose) {
        if (verbose === void 0) { verbose = false; }
        // Store probabilities of learner winning
        var learnerWin = [];
        for (var i = 0; i < this.h; i++) {
            learnerWin.push(1 / this.n); // First few are random
        }
        // Create learner (to simulate playing against)
        var learner = new Learner(this.n, this.h, eta);
        // Set up the initial history
        var history = "";
        for (var i = 0; i < this.h; i++) {
            history += "0";
            learner.observeAction(0);
        }
        // Simulate playing against adversary
        for (var i = this.h; i < input.length; i++) {
            // Consider the probabilities the learner is using to make prediction on this round
            var probs = learner.getActionProbabilities(history);
            // Observe action
            var a = parseInt(input[i]);
            learner.observeAction(a);
            // Calculate probability of winning
            learnerWin.push(probs[a]);
            // Update history
            history = history.substring(1) + a;
        }
        // Calculate probabilities of adversary winning
        var userWin = [];
        for (var i = 0; i < learnerWin.length; i++) {
            userWin.push(1 - learnerWin[i]);
        }
        // Calculate expected scores after each round
        var userScores = Experiment._cumsum(userWin);
        var learnerScores = Experiment._cumsum(learnerWin);
        // Find gameover round T (whoever gets to 100 first)
        var U = Experiment._argwhere(userScores, function (x) { return x > 99.5; });
        var L = Experiment._argwhere(learnerScores, function (x) { return x > 99.5; });
        var T = Math.min(U, L);
        // Print out the results
        if (verbose) {
            console.log("learnerWin = [" + learnerWin.toString() + "]\n" +
                "userWin = [" + userWin.toString() + "]\n" +
                "userScores = [" + userScores.toString() + "]\n" +
                "learnerScores = [" + learnerScores.toString() + "]");
        }
        // Return expected final scores at the end of the game
        return [userScores[T], learnerScores[T]];
    };
    // Run experiments for given etas (count = 0 --> simulate)
    Experiment.prototype.run = function (etas, input, count) {
        var userScores = [];
        var learnerScores = [];
        var rounds = [];
        var userPercent = [];
        var learnerPercent = [];
        // Run all those experiments
        for (var i = 0; i < etas.length; i++) {
            var results = [-1, -1];
            // Compute expectation or compute Monte Carlo average
            if (count == 0) {
                results = this.simulate(etas[i], input);
            }
            else {
                results = this.runAverage(etas[i], input, count);
            }
            var u = results[0];
            var l_1 = results[1];
            userScores.push(u);
            learnerScores.push(l_1);
            rounds.push(u + l_1);
            userPercent.push(u / (u + l_1) * 100);
            learnerPercent.push(l_1 / (u + l_1) * 100);
        }
        // Print out the results
        console.log("etas = [" + etas.toString() + "]\n" +
            "user = [" + userScores.toString() + "]\n" +
            "learner = [" + learnerScores.toString() + "]\n" +
            "rounds = [" + rounds.toString() + "]\n" +
            "user % = [" + userPercent.toString() + "]\n" +
            "learner % = [" + learnerPercent.toString() + "]");
        return [etas, userScores, learnerScores, rounds, userPercent, learnerPercent];
    };
    // Generate a predictable, cyclic pattern
    Experiment.prototype.generatePattern = function (pattern) {
        var result = "";
        while (result.length < 200) {
            result += pattern;
        }
        return result;
    };
    // Generate the "omniscient", strategic adversary's input
    Experiment.prototype.generateAdversary = function () {
        // Create table (rows = experts, cols = actions)
        var table = {};
        var num_experts = Math.pow(this.n, this.h);
        // Put in empty arrays in each row (all possible histories)
        for (var i = 0; i < num_experts; i++) {
            // Generate key (a possible history)
            var key = i.toString(this.n);
            while (key.length < this.h) {
                key = "0" + key;
            }
            // Add the initial counts (0) to the table
            table[key] = [];
            for (var i_1 = 0; i_1 < this.n; i_1++) {
                table[key].push(0);
            }
        }
        // Set up (initial history, resulting adversarial string)
        var adversary = "";
        var history = "";
        for (var i = 0; i < this.h; i++) {
            adversary += "0";
            history += "0";
        }
        // Add an action one at a time
        while (adversary.length < 200) {
            // Choose an action from our options
            var options = table[history];
            var action = Experiment._argmin(options);
            // Increment appropriate cell in table
            table[history][action]++;
            // Update adversarial pattern and the history
            adversary += action;
            history = history.substring(1) + action;
        }
        return adversary;
    };
    // Helper function to get index of minimum element in given array
    Experiment._argmin = function (array) {
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
    // Return the cumulative sum of the given array
    Experiment._cumsum = function (array) {
        var result = [];
        var sum = 0;
        for (var i = 0; i < array.length; i++) {
            sum += array[i];
            result.push(sum);
        }
        return result;
    };
    // Return the first index of the element in the array that satisfies the predicate
    Experiment._argwhere = function (array, predicate) {
        for (var i = 0; i < array.length; i++) {
            if (predicate(array[i])) {
                return i;
            }
        }
        return Number.POSITIVE_INFINITY;
    };
    return Experiment;
}());
/********************************************************************************
 * ProgressBar: Visual component representing the current game score
 *******************************************************************************/
var ProgressBar = /** @class */ (function () {
    // Constructor: progress bar for "user" or "learner" (POV for point of view)
    function ProgressBar(POV, color) {
        // Get canvas, set dimensions
        var canvas = document.getElementById(POV + "Canvas");
        canvas.height = 100;
        canvas.width = 100;
        // Set up contex, color, and initial bar
        this.ctx = canvas.getContext("2d");
        this.ctx.fillStyle = color;
        this.bar = 0;
    }
    // Fill the progress bar a little bit (by 1%)
    ProgressBar.prototype.fill = function () {
        this.ctx.fillRect(this.bar, 0, 1, 100);
        this.bar++;
    };
    return ProgressBar;
}());
/********************************************************************************
 * Matching Pennies game: Script that implements interactive online game
 *******************************************************************************/
// HTML document elements
var uPenny = document.getElementById("userPenny");
var lPenny = document.getElementById("learnerPenny");
var uScore = document.getElementById("userScore");
var lScore = document.getElementById("learnerScore");
var gameover = document.getElementById("gameover");
var user = document.getElementById("user");
var learner = document.getElementById("learner");
// Create learner and set scores to 0
var l = new Learner(2, 3, 0.5); // <-- matching pennies
var userScore = 0;
var learnerScore = 0;
// Display dummy pennies and starting progress bar
uPenny.setAttribute("src", "heads_dummy.jpg");
lPenny.setAttribute("src", "tails_dummy.jpg");
var userPB = new ProgressBar("user", "#008CBA");
var learnerPB = new ProgressBar("learner", "#ff471a");
window.onkeydown = function (e) {
    // Get keypress
    var action = 1;
    if (e.keyCode == 37) {
        action = 0;
    } // left = heads = 0
    else if (e.keyCode == 39) {
        action = 1;
    } // right = tails = 1
    else {
        return;
    }
    // Hide labels
    user.style.display = "none";
    learner.style.display = "none";
    // Get learner prediction, observe user action
    var prediction = l.predict();
    l.observeAction(action);
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
        learnerPB.fill();
    }
    else {
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
        uPenny.setAttribute("src", "heads_dummy.jpg");
        lPenny.setAttribute("src", "tails_dummy.jpg");
    }
};
