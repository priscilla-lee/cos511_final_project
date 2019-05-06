/******************************************************************************** 
 * Experiment: Simulates game given adversary input (allows varying etas).
 * 						 Generates predictable input and worst-case adversarial input.
 *******************************************************************************/

class Experiment {
	public n: number;
	public h: number; 

	// Experiment for an n-strategy game, using context trees of given depth h
	public constructor(n: number, h: number) {
		this.n = n; 
		this.h = h; 
	}

	// Run a single experiment
	public runSingle(eta: number, input: string): number[] {
		const learner = new Learner(this.n, this.h, eta);

		let userScore = 0; 
		let learnerScore = 0; 

		// Play each round until someone wins
		for (let i = 0; i < input.length; i++) {
			const p: number = learner.predict(); // Predict
			const a: number = parseInt(input[i]); // Observe user action

			if (p == a) { learnerScore++; } 
			else        { userScore++;    }

			// After someone wins, return both resulting scores
			if (Math.max(userScore, learnerScore) >= 100) {
				return [userScore, learnerScore]; 
			}

			learner.observeAction(a); 
		}
	}

	// Run experiments repeatedly, then average the user and learner scores
	public runAverage(eta: number, input: string, count: number): number[] {
		let userSum = 0;
		let learnerSum = 0;
		
		// Run experiments <count> times
		for (let i = 0; i < count; i++) {
			const scores = this.runSingle(eta, input);
			userSum += scores[0];
			learnerSum += scores[1]; 
		}

		return [userSum/count, learnerSum/count];
	}


	// Return expected final scores when simulating play against adversary
	public simulate(eta: number, input: string, verbose = false): number[] {
		// Store probabilities of learner winning
		let learnerWin = [];
		for (let i = 0; i < this.h; i++) {
			learnerWin.push(1 / this.n); // First few are random
		}

		// Create learner (to simulate playing against)
		const learner = new Learner(this.n, this.h, eta);

		// Set up the initial history
		let history = "";
		for (let i = 0; i < this.h; i++) {
			history += "0";
			learner.observeAction(0);
		}

		// Simulate playing against adversary
		for (let i = this.h; i < input.length; i++) {
			// Consider the probabilities the learner is using to make prediction on this round
			const probs = learner.getActionProbabilities(history);

			// Observe action
			const a: number = parseInt(input[i]);
			learner.observeAction(a);

			// Calculate probability of winning
			learnerWin.push(probs[a])

			// Update history
			history = history.substring(1) + a;
		}

		// Calculate probabilities of adversary winning
		let userWin = [];
		for (let i = 0; i < learnerWin.length; i++) {
			userWin.push(1 - learnerWin[i]);
		}

		// Calculate expected scores after each round
		let userScores = Experiment._cumsum(userWin);
		let learnerScores = Experiment._cumsum(learnerWin);

		// Find gameover round T (whoever gets to 100 first)
		const U = Experiment._argwhere(userScores, x => x > 99.5);
		const L = Experiment._argwhere(learnerScores, x => x > 99.5);
		const T = Math.min(U, L);

		// Print out the results
		if (verbose) {
			console.log("learnerWin = [" + learnerWin.toString() + "]\n" + 
									"userWin = [" + userWin.toString() + "]\n" +
									"userScores = [" + userScores.toString() + "]\n" +
									"learnerScores = [" + learnerScores.toString() + "]");
		}

		// Return expected final scores at the end of the game
		return [userScores[T], learnerScores[T]];
	}

	// Run experiments for given etas (count = 0 --> simulate)
	public run(etas: number[], input: string, count: number): number[][] {
		let userScores = [];
		let learnerScores = [];
		let rounds = [];
		let userPercent = [];
		let learnerPercent = [];

		// Run all those experiments
		for (let i = 0; i < etas.length; i++) {
			let results = [-1, -1];

			// Compute expectation or compute Monte Carlo average
			if (count == 0) { 
				results = this.simulate(etas[i], input);
			} else { 
				results = this.runAverage(etas[i], input, count);
			}

			const u = results[0];
			const l = results[1];

			userScores.push(u);
			learnerScores.push(l);
			rounds.push(u + l);
			userPercent.push(u / (u + l) * 100);
			learnerPercent.push(l / (u + l) * 100);
		}

		// Print out the results
		console.log("etas = [" + etas.toString() + "]\n" + 
								"user = [" + userScores.toString() + "]\n" +
								"learner = [" + learnerScores.toString() + "]\n" +
								"rounds = [" + rounds.toString() + "]\n" +
								"user % = [" + userPercent.toString() + "]\n" +
								"learner % = [" + learnerPercent.toString() + "]");

		return [etas, userScores, learnerScores, rounds, userPercent, learnerPercent];
	}

	// Generate a predictable, cyclic pattern
	public generatePattern(pattern: string): string {
		let result = ""; 
		while (result.length < 200) {
			result += pattern;
		}
		return result; 
	}

	// Generate the "omniscient", strategic adversary's input
	public generateAdversary(): string {
		// Create table (rows = experts, cols = actions)
		let table = {};
		const num_experts = Math.pow(this.n, this.h);

		// Put in empty arrays in each row (all possible histories)
		for (let i = 0; i < num_experts; i++) {
			// Generate key (a possible history)
			let key = i.toString(this.n);
			while (key.length < this.h) {
				key = "0" + key;
			}

			// Add the initial counts (0) to the table
			table[key] = []; 
			for (let i = 0; i < this.n; i++) {
				table[key].push(0);
			}
		}

		// Set up (initial history, resulting adversarial string)
		let adversary = ""; 
		let history = "";
		for (let i = 0; i < this.h; i++) {
			adversary += "0";
			history += "0";
		}

		// Add an action one at a time
		while (adversary.length < 200) {
			// Choose an action from our options
			const options: number[] = table[history];
			const action: number = Experiment._argmin(options);

			// Increment appropriate cell in table
			table[history][action]++;

			// Update adversarial pattern and the history
			adversary += action;
			history = history.substring(1) + action;
		}

		return adversary;
	}

	// Helper function to get index of minimum element in given array
	static _argmin(array: number[]): number {
		let min = array[0];
		let minIndex = 0;

		for (let i = 0; i < array.length; i++) {
			if (array[i] < min) {
				min = array[i];
				minIndex = i;
			}
		}

		return minIndex;
	}

	// Return the cumulative sum of the given array
	static _cumsum(array: number[]): number[] {
		let result = [];

    let sum = 0;
    for (let i = 0; i < array.length; i++) {
      sum += array[i];
      result.push(sum);
    }

    return result;
	}

	// Return the first index of the element in the array that satisfies the predicate
	static _argwhere(array: number[], predicate): number {
		for (let i = 0; i < array.length; i++) {
			if (predicate(array[i])) {
				return i;
			}
		}
		return Number.POSITIVE_INFINITY;
	}
}