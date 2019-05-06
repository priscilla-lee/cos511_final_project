/******************************************************************************** 
 * 
 * 
 *
 *******************************************************************************/

class Experiment {
	public num_actions: number;
	public history_length: number; 

	// Experiment for an n-strategy game, using context trees of given depth
	public constructor(num_actions: number, history_length: number) {
		this.num_actions = num_actions; 
		this.history_length = history_length; 
	}

	// Run a single experiment
	public runSingle(eta: number, input: string): number[] {
		const learner = new Learner(this.num_actions, this.history_length, eta);

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

	// Run experiments, varying etas according to given range
	public runForRange(eta_lo:number, eta_high: number, eta_step: number, input: string, count: number): number[][] {
		// List all etas in range
		let etas = [];
		for (let i = eta_lo; i < eta_high; i += eta_step) {
			etas.push(i);
		}

		return this.run(etas, input, count);
	}

	// Run experiments for given etas
	public run(etas: number[], input: string, count: number): number[][] {
		let userScores = [];
		let learnerScores = [];

		// Run all those experiments
		for (let i = 0; i < etas.length; i++) {
			const results = this.runAverage(etas[i], input, count);
			userScores.push(results[0]);
			learnerScores.push(results[1]);
		}

		// Print out the results
		console.log("etas = [" + etas.toString() + "]\n" + 
								"user = [" + userScores.toString() + "]\n" +
								"learner = [" + learnerScores.toString() + "]");

		return [etas, userScores, learnerScores];
	}

	// Generate a predictable, cyclic pattern
	static generatePattern(pattern: string): string {
		let result = ""; 
		while (result.length < 200) {
			result += pattern;
		}
		return result; 
	}

	// Create a table (rows = experts, columns = actions) for the purposes of 
	// generating adversaries and simulating adversary
	private _createTable() {
		let table = {};
		const num_experts = Math.pow(this.num_actions, this.history_length);

		// Put in empty arrays in each row (all possible histories)
		for (let i = 0; i < num_experts; i++) {
			// Generate key (a possible history)
			let key = i.toString(this.num_actions);
			while (key.length < this.history_length) {
				key = "0" + key;
			}

			// Add the initial counts (0) to the table
			table[key] = []; 
			for (let i = 0; i < this.num_actions; i++) {
				table[key].push(0);
			}
		}

		return table;
	}

	// Generate the "omniscient", strategic adversary's input
	public generateAdversary(): string {
		let table = this._createTable();

		// Set up (initial history, resulting adversarial string)
		let adversary = ""; 
		let history = "";
		for (let i = 0; i < this.history_length; i++) {
			adversary += "0";
			history += "0";
		}

		// Add an action one at a time
		while (adversary.length < 200) {
			// Choose an action from our options
			const options: number[] = table[history];
			const action: number = Experiment._getMinIndex(options);

			// Increment appropriate cell in table
			table[history][action]++;

			// Update adversarial pattern and the history
			adversary += action;
			history = history.substring(1) + action;
		}

		return adversary;
	}

	// Return a list of probabilities that the learner wins on round t
	public simulateAdversary(eta: number): number[] {
		// Store probabilities (of learner winning)
		let pWin = [];
		for (let i = 0; i < this.history_length; i++) {
			pWin.push(1 / this.num_actions); // First few are random
		}

		// Create learner (to simulate playing against)
		const learner = new Learner(this.num_actions, this.history_length, eta);

		// Set up the initial history
		let history = "";
		for (let i = 0; i < this.history_length; i++) {
			history += "0";
			learner.observeAction(0);
		}

		// Simulate playing against adversary
		const adversary = this.generateAdversary();
		for (let i = this.history_length; i < adversary.length; i++) {
			// Consider the probabilities the learner is using to make prediction on this round
			const probs = learner.getProbabilitiesOfActions(history);

			// Observe action
			const a: number = parseInt(adversary[i]);
			learner.observeAction(a);

			// Calculate probability of winning
			pWin.push(probs[a])

			// Update history
			history = history.substring(1) + a;
		}

		return pWin;
	}

	// Normalize an input array of numbers (sum to 1)
  private _normalize(counts: number[]): number[] {
    const sum = counts.reduce((a, b) => a + b, 0);
    return counts.map(p => p / sum);
  }

	// Helper function to get index of minimum element in given array
	static _getMinIndex(array: number[]): number {
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
}