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
		for (let i = 0; i < this.h; i++) {
			pWin.push(1 / this.n); // First few are random
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
		const adversary = this.generateAdversary();
		for (let i = this.h; i < adversary.length; i++) {
			// Consider the probabilities the learner is using to make prediction on this round
			const probs = learner.getActionProbabilities(history);

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