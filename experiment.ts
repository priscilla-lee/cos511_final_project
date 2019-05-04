class Experiment {
	public learner: Learner; 
	public num_actions: number;
	public history_length: number; 

	public constructor(num_actions: number, eta: number, history_length: number){
		this.learner = new Learner(num_actions, eta, history_length);

	}

	public run(input: string): number[] {
		Let userScore = 0; 
		Let learnerScore = 0; 

		for(Let i = 0; i < input.length; i++) {
			const a = input[i];
			const p = this.Learner.predict();

			if (p == a) {
				learnerScore++;
			} else {
				userScore++;
			}

			if (Math.max(p,a) >= 100) {
				return [userScore,learnerScore]; 
			}

			this.Learner.addAction(a); 
		}
	}
}