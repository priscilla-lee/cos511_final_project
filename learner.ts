/******************************************************************************** 
 * 
 * 
 *
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
  }

  // Predict according to algorithm
  public predict(): number {
    const p = this._predictExpertly(); 
    this.predictions.push(p);
    return p;
  }

  // Observe user action, update weights
  public observeAction(action: number): void {
    this._updateExpertWeights(action);
    this.actions.push(action);
  }

  // Get the learner's current probabilities of s
  public getProbabilitiesOfActions(history: string): number[] {
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

  /* -------------------------------------------------------
                      Updating algorithms
  ------------------------------------------------------- */

  // Multiplicative weights with context tree experts (page 156 in textbook)
  private _updateExpertWeights(action: number): void {
    // If we don't have enough history, ignore
    if (this.actions.length < this.h) { return; }

    // Get h most recent actions (history)
    const history = this.actions.join("").substring(this.actions.length-this.h);

    // Update weights: (only) penalize experts that made mistakes
    for (let i = 0; i < this.weights.length; i++) {
      if (this.experts[i].predict(history) != action) {
        // bigger eta --> harsher penalty
        this.weights[i] = this.weights[i] * Math.pow(Math.E, -this.eta);
      }
    }

    // Finally, normalize weights
    this.weights = this._normalize(this.weights);
  }

  /* -------------------------------------------------------
                      Prediction algorithms
  ------------------------------------------------------- */

  // Expert prediction: choose prediction of expert according to weights
  private _predictExpertly(): number {
    // If we don't have enough history, just predict randomly
    if (this.actions.length < this.h) { 
      return this._predictRandomly();
    }

    // Choose expert randomly (according to weights)
    const index = this._discrete(this.weights);
    const expert = this.experts[index];

    // Get h most recent actions (history)
    const history = this.actions.join("").substring(this.actions.length-this.h);
    
    // Return the prediction of the chosen expert, given the history
    return expert.predict(history);
  }

  // Random prediction: 1/2 heads, 1/2 tails
  private _predictRandomly(): number {
    return +!(Math.random() < 0.5); // true --> 0, false --> 1
  }

  /* -------------------------------------------------------
        Helper functions (with probability distributions)
  ------------------------------------------------------- */

  // Randomly choose an index given array of probabilities
  private _discrete(probabilities: number[]): number {
    // Step 0: make a defensive copy!
    let copy = [];
    for (let i = 0; i < probabilities.length; i++) {
      copy.push(probabilities[i]);
    }

    // Step 1: cumulative sum
    let sum = 0;
    for (let i = 0; i < copy.length; i++) {
      sum += copy[i];
      copy[i] = sum;
    }

    // Step 2: choose a random index
    const rand = Math.random();
    for (let i = 0; i < copy.length; i++) {
      if (rand < copy[i]) {
        return i;
      }
    } return copy.length -1;
  }

  // Normalize an input array of numbers (sum to 1)
  private _normalize(probabilities: number[]): number[] {
    const sum = probabilities.reduce((a, b) => a + b, 0);
    return probabilities.map(p => p / sum);
  }
}