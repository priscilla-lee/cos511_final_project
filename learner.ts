class Learner {
  public actions: number[]; // 0 (heads) or 1 (tails)
  public predictions: number[]; // 0 or 1

  // vectors for learning
  public weights: number[]; 
  public probability: number[];
  public eta: number;

  // experts for learning
  public experts: Expert[]; // 256 context trees (with history h = 3)
  public Pt: number[]; // probability distribution over experts

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

    // distribution Pt that we are learning
    this.Pt = [];
    for (let i = 0; i < 256; i++) {
      this.Pt.push(1/256);
    }

    // set up 255 experts (using history h = 3)
    this.experts = [];
    for (let i = 0; i < 256; i++) {
      this.experts.push(new Expert(i));
    }
  }

  // Predict according to algorithm
  public predict(): number {
    const p = this._predictExpertly(); 
    this.predictions.push(p);

    console.log("     user: " + this.actions);
    console.log("  learner: " + this.predictions);
    console.log("  weights: " + this.weights);

    return p;
  }

  // Observe user action, update weights
  public addAction(action: number): void {
    this._updateExpertWeights(action);
    this.actions.push(action);

    console.log("updated p: " + this.probability);
    console.log("");
  }


  // Reward: 1 if same, -1 if different/mistake
  private _reward(action: number, prediction: number) {
    if (action == prediction) return 1;
    else return -1;
  }

  /* -------------------------------------------------------
                      Updating algorithms
  ------------------------------------------------------- */

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
  public _updateExpertWeights(action: number): void {
    // If we don't have enough history, ignore
    if (this.actions.length < 3) {
      return;
    }

    // Get 3 most recent actions (history)
    const history = this.actions.join("").substring(this.actions.length-3);

    // Update Pt according to which experts would've predicted the action correctly
    // i.e. (only) penalize experts that made mistakes
    for (let i = 0; i < this.Pt.length; i++) {
      if (this.experts[i].predict(history) != action) { // mistake!
        this.Pt[i] = this.Pt[i] * Math.pow(Math.E, -this.eta);
      }
    }

    // Finally, normalize Pt
    this.Pt = this._normalize(this.Pt);
  }


  // Multiplicative weights algorithm: update rule
  private _updateMW(action: number): void {
    // update weights vector
    this.weights[0] *= (1 + this.eta * this._reward(action, 0));
    this.weights[1] *= (1 + this.eta * this._reward(action, 1));

    // update probability vector
    this.probability = this._normalize(this.weights);
  }

  /* -------------------------------------------------------
                      Prediction algorithms
  ------------------------------------------------------- */

  // Expert prediction: choose prediction of expert according to Pt
  public _predictExpertly(): number {
    // If we don't have enough history, just predict randomly
    if (this.actions.length < 3) {
      return this._predictRandomly();
    }

    // Choose expert randomly (according to Pt)
    const index = this._discrete(this.Pt);
    const expert = this.experts[index];

    // Get 3 most recent actions (history)
    const history = this.actions.join("").substring(this.actions.length-3);
    
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
        Helper functions with probability distributions
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