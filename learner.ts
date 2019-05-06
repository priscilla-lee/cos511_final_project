/******************************************************************************** 
 * Learner: Implements the multiplicative weights algorithm.
 *          Can predict actions, observe actions, and update weights.
 *          Generalizes to n-strategy games, using context-trees with history h.
 *******************************************************************************/

class Learner {
  public actions: number[]; // 0 (heads) or 1 (tails)
  public predictions: number[]; // 0 or 1

  // Learner parameters
  public n: number; // number of actions
  public h: number; // history length
  public eta: number; // learning rate

  // Context tree experts and their weights
  public experts: Expert[];
  public weights: number[];

  // Uniform weights (pre-computed to save time)
  private _uniform: number[];

  // Constructor: number of actions (n), history/context length (h), learning rate (eta)
  public constructor(n: number, h: number, eta: number) {
    this.actions = [];
    this.predictions = [];

    this.n = n;
    this.h = h;
    this.eta = eta;

    this.experts = [];
    this.weights = [];

    // Enumerate experts and set uniform weights
    const num_experts = Math.pow(n, Math.pow(n, h)); // e.g. 256 (or 19683)
    for (let i = 0; i < num_experts; i++) {
      this.experts.push(new Expert(i, n, h));
      this.weights.push(1/num_experts); // uniform probability
    }

    // Construct uniform weights (pre-computed for computational efficiency)
    this._uniform = [];
    for (let i = 0; i < this.n; i++) {
      this._uniform.push(1);
    }
  }

  // Helper method to get the history (h most recent actions)
  private _getHistory(): string {
    return this.actions.join("").substring(this.actions.length-this.h);
  }

  // Predict according to weighted context-tree experts
  public predict(): number {
    // Predict completely randomly if not enough history
    let p = this._predictRandomly();

    // If enough history, predict based on weighted experts
    if (this.actions.length >= this.h) { 
      // Choose expert randomly (according to weights)
      const index = this._discrete(this.weights);
      const expert = this.experts[index];

      // Return the prediction of the chosen expert, given the history
      p = expert.predict(this._getHistory());
    }

    // Add to list of learner predictions
    this.predictions.push(p);
    return p;
  }

  // Observe user action, and update weights according to the 
  // multiplicative weights algorithm (page 156 in textbook)
  public observeAction(action: number): void {
    // If we don't have enough history, ignore
    if (this.actions.length < this.h) { return; }

    // Update weights: (only) penalize experts that made mistakes
    for (let i = 0; i < this.weights.length; i++) {
      if (this.experts[i].predict(this._getHistory()) != action) {
        // bigger eta --> harsher penalty
        this.weights[i] = this.weights[i] * Math.pow(Math.E, -this.eta);
      }
    }

    // Finally, normalize weights
    this.weights = this._normalize(this.weights);

    // Add to list of user actions
    this.actions.push(action);
  }

  // Get the learner's current probabilities of s
  public getActionProbabilities(history: string): number[] {
    let probs = [];
    for (let i = 0; i < this.n; i++) {
      probs.push(0);
    }

    // Sum up probabilities (across experts who would've predicted that action)
    for (let i = 0; i < this.experts.length; i++) {
      const e = this.experts[i];
      probs[e.predict(history)] += this.weights[i];
    }

    return probs;
  }

  // Random prediction: uniformly (e.g. 1/2 heads, 1/2 tails)
  private _predictRandomly(): number {
    return this._discrete(this._uniform);
  }

  // Randomly choose an index given array of probabilities
  private _discrete(weights: number[]): number {
    // Get probability distribution p
    let p = this._normalize(weights);

    // Step 1: cumulative sum
    let sum = 0;
    for (let i = 0; i < p.length; i++) {
      sum += p[i];
      p[i] = sum;
    }

    // Step 2: choose a random index
    const rand = Math.random();
    for (let i = 0; i < p.length; i++) {
      if (rand < p[i]) {
        return i;
      }
    } return p.length -1;
  }

  // Normalize array to a probability distribution (sum to 1)
  private _normalize(weights: number[]): number[] {
    const sum = weights.reduce((a, b) => a + b, 0);
    return weights.map(p => p / sum);
  }
}