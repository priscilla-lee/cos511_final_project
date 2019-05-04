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
			const key = i.toString(this.num_actions);
			table[key] = [0, 0];
		}

		// Set up (initial history, resulting adversarial string)
		let adversary = "000";
		let history = "000";

		// Add an action one at a time
		while (adversary.length < 200) {
			const options: number[] = table[history];
			const action = Experiment._getMinIndex(options);

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