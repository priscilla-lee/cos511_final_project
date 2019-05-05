class Experiment {
	public num_actions: number;
	public history_length: number; 

	public constructor(num_actions: number, history_length: number) {
		this.num_actions = num_actions; 
		this.history_length = history_length; 
	}

	public run(eta: number, input: string): number[] {
		const learner = new Learner(this.num_actions, eta, this.history_length);

		let userScore = 0; 
		let learnerScore = 0; 

		for (let i = 0; i < input.length; i++) {
			const a: number = parseInt(input[i]);
			const p: number = learner.predict();

			if (p == a) {
				learnerScore++;
			} else {
				userScore++;
			}

			if (Math.max(userScore, learnerScore) >= 100) {
				return [userScore, learnerScore]; 
			}

			learner.addAction(a); 
		}
	}

	public runRepeatedly(eta: number, input: string, count: number): number[][] {
		let results = [];
		for (let i = 0; i < count; i++) {
			results.push(this.run(eta, input));		
		}
		return results; 
	}

	public runAverage(eta: number, input: string, count: number): number[] {
		let results = this.runRepeatedly(eta, input, count);

		let userSum = 0;
		let learnerSum = 0;
		for (let i = 0; i < results.length; i++) {
			userSum += results[i][0];
			learnerSum += results[i][1];
		}

		return [userSum/results.length, learnerSum/results.length];
	}

	public outputResults(eta_lo:number, eta_high: number, eta_step: number, input: string, count: number): number[][] {
		// List etas
		let etas = [];
		for (let i = eta_lo; i < eta_high; i += eta_step) {
			etas.push(i);
		}

		let userScores = [];
		let learnerScores = [];

		// Run all those experiments
		for (let i = 0; i < etas.length; i++) {
			const results = this.runAverage(etas[i], input, count);
			userScores.push(results[0]);
			learnerScores.push(results[1]);
		}

		return [etas, userScores, learnerScores];
	}

	static generatePattern(pattern: string): string {
		let result = ""; 
		while (result.length < 200) {
			result += pattern;
		}
		return result; 
	}

	public generateAdversary(): string {
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