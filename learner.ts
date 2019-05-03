class Learner {
  public actions: number[]; // 0 (heads) or 1 (tails)
  public predictions: number[]; // 0 or 1

  // (Option 1) 2 experts
  public weights: number[]; 
  public probability: number[];
  public eta: number;

  // (Option 2) 256 experts with context trees
  public experts: Expert[]; 
  public Pt: number[];
  public h: number; // history length

  // Constructor: store actions, predictions, weights, and p's
  public constructor(num_actions: number, eta: number, history_length: number) {
    this.actions = [];
    this.predictions = [];
    this.eta = eta;

    // (Option 1) 2 experts
    this.weights = [];
    this.probability = [];
    for (let i = 0; i < num_actions; i++) {
      this.weights.push(1);
      this.probability.push(1/num_actions); // uniform probability
    }

    // (Option 2) 256 (or 19683) experts with context trees
    const num_experts = Math.pow(num_actions, Math.pow(num_actions, history_length));
    this.h = history_length;
    this.experts = [];
    this.Pt = [];
    for (let i = 0; i < num_experts; i++) {
      this.experts.push(new Expert(i, num_actions, history_length));
      this.Pt.push(1/num_experts); // uniform probability
    }
  }

  // Predict according to algorithm
  public predict(): number {
    const p = /*Option 2*/ this._predictExpertly(); 
         // = /*Option 1*/ this._predictProbabilistically();
    this.predictions.push(p);

    // console.log("     user: " + this.actions);
    // console.log("  learner: " + this.predictions);
    // console.log("  weights: " + this.weights);

    return p;
  }

  // Observe user action, update weights
  public addAction(action: number): void {
    /*Option 2*/ this._updateExpertWeights(action);
    //Option 1   this._updateMultiplicativeWeights(action);

    this.actions.push(action);

    // console.log("updated p: " + this.probability);
    // console.log("");
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

    // Update Pt: (only) penalize experts that made mistakes
    for (let i = 0; i < this.Pt.length; i++) {
      if (this.experts[i].predict(history) != action) {
        // bigger eta --> harsher penalty
        this.Pt[i] = this.Pt[i] * Math.pow(Math.E, -this.eta);
      }
    }

    // Finally, normalize Pt
    this.Pt = this._normalize(this.Pt);
  }

  // Multiplicative weights algorithm: update rule
  private _updateMultiplicativeWeights(action: number): void {
    // update weights vector
    this.weights[0] *= (1 + this.eta * this._reward(action, 0));
    this.weights[1] *= (1 + this.eta * this._reward(action, 1));

    // update probability vector
    this.probability = this._normalize(this.weights);
  }

  // Simple algorithm: counts and proportions
  private _updateCounts(action: number): void {
    this.weights[action]++;
    this.probability = this._normalize(this.weights);
  }

  /* -------------------------------------------------------
                      Prediction algorithms
  ------------------------------------------------------- */

  // Expert prediction: choose prediction of expert according to Pt
  private _predictExpertly(): number {
    // If we don't have enough history, just predict randomly
    if (this.actions.length < this.h) { 
      return this._predictRandomly();
    }

    // Choose expert randomly (according to Pt)
    const index = this._discrete(this.Pt);
    const expert = this.experts[index];

    // Get h most recent actions (history)
    const history = this.actions.join("").substring(this.actions.length-this.h);
    
    // Return the prediction of the chosen expert, given the history
    return expert.predict(history);
  }

  // Simple prediction: predict according to probability
  private _predictProbabilistically(): number {
    return +!(Math.random() < this.probability[0]);
  }

  // Stupid prediction: predict action with higher probability
  private _predictDeterministically(): number {
    return +!(this.probability[0] > this.probability[1]);
  }

  // Random prediction: 1/2 heads, 1/2 tails
  private _predictRandomly(): number {
    return +!(Math.random() < 0.5); // true --> 0, false --> 1
  }

  /* -------------------------------------------------------
        Helper functions (with probability distributions)
  ------------------------------------------------------- */

  // Reward: 1 if same, -1 if different/mistake
  private _reward(action: number, prediction: number) {
    if (action == prediction) return 1;
    else return -1;
  }

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