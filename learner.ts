class Learner {
  public actions: number[]; // 0 (heads) or 1 (tails)
  public predictions: number[]; // 0 or 1

  // vectors for learning
  public weights: number[]; 
  public probability: number[];

  // Constructor: store actions, predictions, weights, and p's
  public constructor(num) {
    this.actions = [];
    this.predictions = [];
    this.weights = [];
    this.probability = [];

    // init w = (0, 0) and p = (1/2, 1/2)
    for (let i = 0; i < num; i++) {
      this.weights.push(0);
      this.probability.push(0.5);
    }
  }

  // Observe user action, update weights
  public addAction(action: number): void {
    this.actions.push(action);
    this._updateSimple(action);

    console.log("updated p: " + this.probability);
    console.log("");
  }

  // Predict according to algorithm
  public predict(): number {
    const p = this._predictStupid();
    this.predictions.push(p);

    console.log("     user: " + this.actions);
    console.log("  learner: " + this.predictions);
    console.log("  weights: " + this.weights);

    return p;
  }

  // Simple: counts and proportions
  private _updateSimple(action: number): void {
    // update weights vector
    this.weights[action]++;

    // update probability vector
    const sum = this.weights.reduce((a, b) => a + b, 0);
    this.probability = this.weights.map(w => w / sum);
  }

  // Simple: predict according to probability
  private _predictSimple(): number {
    return +!(Math.random() < this.probability[0]);
  }

  // Stupid: predict action with higher probability
  private _predictStupid(): number {
    return +!(this.probability[0] > this.probability[1]);
  }

  // Random: completely random 1/2 heads, 1/2 tails
  private _predictRandom(): number {
    return +!(Math.random() < 0.5); // true --> 0, false --> 1
  }
}