/********************************************************************************
 *
 *
 *
 *******************************************************************************/
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
/********************************************************************************
 *
 *
 *
 *******************************************************************************/
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
        // If we don't have enough history, ignore
        if (this.actions.length < this.h) {
            return;
        }
        // Update weights: (only) penalize experts that made mistakes
        for (var i = 0; i < this.weights.length; i++) {
            if (this.experts[i].predict(this._getHistory()) != action) {
                // bigger eta --> harsher penalty
                this.weights[i] = this.weights[i] * Math.pow(Math.E, -this.eta);
            }
        }
        // Finally, normalize weights
        this.weights = this._normalize(this.weights);
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
 *
 *
 *
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
var l = new Learner(3, 2, 0.5); // <-- rock, paper, scissors
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
    l.observeAction(winningPrediction(action));
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
/********************************************************************************
 *
 *
 *
 *******************************************************************************/
var Experiment = /** @class */ (function () {
    // Experiment for an n-strategy game, using context trees of given depth
    function Experiment(num_actions, history_length) {
        this.num_actions = num_actions;
        this.history_length = history_length;
    }
    // Run a single experiment
    Experiment.prototype.runSingle = function (eta, input) {
        var learner = new Learner(this.num_actions, this.history_length, eta);
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
    // Run experiments, varying etas according to given range
    Experiment.prototype.runForRange = function (eta_lo, eta_high, eta_step, input, count) {
        // List all etas in range
        var etas = [];
        for (var i = eta_lo; i < eta_high; i += eta_step) {
            etas.push(i);
        }
        return this.run(etas, input, count);
    };
    // Run experiments for given etas
    Experiment.prototype.run = function (etas, input, count) {
        var userScores = [];
        var learnerScores = [];
        // Run all those experiments
        for (var i = 0; i < etas.length; i++) {
            var results = this.runAverage(etas[i], input, count);
            userScores.push(results[0]);
            learnerScores.push(results[1]);
        }
        // Print out the results
        console.log("etas = [" + etas.toString() + "]\n" +
            "user = [" + userScores.toString() + "]\n" +
            "learner = [" + learnerScores.toString() + "]");
        return [etas, userScores, learnerScores];
    };
    // Generate a predictable, cyclic pattern
    Experiment.generatePattern = function (pattern) {
        var result = "";
        while (result.length < 200) {
            result += pattern;
        }
        return result;
    };
    // Create a table (rows = experts, columns = actions) for the purposes of 
    // generating adversaries and simulating adversary
    Experiment.prototype._createTable = function () {
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
        return table;
    };
    // Generate the "omniscient", strategic adversary's input
    Experiment.prototype.generateAdversary = function () {
        var table = this._createTable();
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
    // Return a list of probabilities that the learner wins on round t
    Experiment.prototype.simulateAdversary = function (eta) {
        // Store probabilities (of learner winning)
        var pWin = [];
        for (var i = 0; i < this.history_length; i++) {
            pWin.push(1 / this.num_actions); // First few are random
        }
        // Create learner (to simulate playing against)
        var learner = new Learner(this.num_actions, this.history_length, eta);
        // Set up the initial history
        var history = "";
        for (var i = 0; i < this.history_length; i++) {
            history += "0";
            learner.observeAction(0);
        }
        // Simulate playing against adversary
        var adversary = this.generateAdversary();
        for (var i = this.history_length; i < adversary.length; i++) {
            // Consider the probabilities the learner is using to make prediction on this round
            var probs = learner.getActionProbabilities(history);
            // Observe action
            var a = parseInt(adversary[i]);
            learner.observeAction(a);
            // Calculate probability of winning
            pWin.push(probs[a]);
            // Update history
            history = history.substring(1) + a;
        }
        return pWin;
    };
    // Normalize an input array of numbers (sum to 1)
    Experiment.prototype._normalize = function (counts) {
        var sum = counts.reduce(function (a, b) { return a + b; }, 0);
        return counts.map(function (p) { return p / sum; });
    };
    // Helper function to get index of minimum element in given array
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
