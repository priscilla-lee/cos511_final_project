class Learner {
  public actions: number[]; // 0 (heads) or 1 (tails)
  public predictions: number[]; // 0 or 1

  // vectors for learning
  public weights: number[]; 
  public probability: number[];
  public eta: number;

  // Constructor: store actions, predictions, weights, and p's
  public constructor(num, eta) {
    this.actions = [];
    this.predictions = [];
    this.weights = [];
    this.probability = [];
    this.eta = eta;

    // init w = (1, 1) and p = (1/2, 1/2)
    for (let i = 0; i < num; i++) {
      this.weights.push(1); // 1 for MW, 0 for simple algorithm
      this.probability.push(0.5);
    }
  }

  // Observe user action, update weights
  public addAction(action: number): void {
    this.actions.push(action);
    this._updateMW(action);

    console.log("updated p: " + this.probability);
    console.log("");
  }

  // Predict according to algorithm
  public predict(): number {
    const p = this._predictProbabilistically();
    this.predictions.push(p);

    console.log("     user: " + this.actions);
    console.log("  learner: " + this.predictions);
    console.log("  weights: " + this.weights);

    return p;
  }

  // Reward: 1 if same, -1 if different/mistake
  private _reward(action: number, prediction: number) {
    if (action == prediction) return 1;
    else return -1;
  }

  // Simple algorithm: counts and proportions
  private _updateSimple(action: number): void {
    // update weights vector
    this.weights[action]++;

    // update probability vector
    const sum = this.weights.reduce((a, b) => a + b, 0);
    this.probability = this.weights.map(w => w / sum);
  }

  // Weighted majority algorithm: page 156 in textbook
  /* Early machines for learning to play penny-matching, as in section 6.5, 
  were invented by Hagelbarger [115] and later by Shannon [213]. Figure 6.3 
  is reprinted from the former. The technique of combining the predictions 
  of all possible context trees is due to Helmbold and Schapire [122], in a 
  direct adaptation of Willems, Shtarkov, and Tjalkens’s method for weighting 
  context trees [231]. The Internet implementation was created by the authors 
  with Anup Doshi. */
  // [115] D. W. Hagelbarger. SEER, A SEquence Extrapolating Robot. IRE Transactions on Electronic Computers , EC-5(1):1– 7, March 1956.
  // [122] David P. Helmbold and Robert E. Schapire. Predicting nearly as well as the best pruning of a decision tree. Machine Learning , 27(1):51– 68, April 1997.
  // [213] Claude E. Shannon. A mind-reading (?) machine. Technical report, Bell Laboratories, 1953.
  // [231] Frans M. J. Willems, Yuri M. Shtarkov, and Tjalling J. Tjalkens. The context tree weighting method: Basic properties. IEEE Transactions on Information Theory , 41(3):653– 664, 1995.
  private _updateWM(action: number): void {

  }

  // Multiplicative weights algorithm: update rule
  private _updateMW(action: number): void {
    // update weights vector
    this.weights[0] *= (1 + this.eta * this._reward(action, 0));
    this.weights[1] *= (1 + this.eta * this._reward(action, 1));

    // update probability vector
    const sum = this.weights.reduce((a, b) => a + b, 0);
    this.probability = this.weights.map(w => w / sum);
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
  private _predictRandom(): number {
    return +!(Math.random() < 0.5); // true --> 0, false --> 1
  }
}