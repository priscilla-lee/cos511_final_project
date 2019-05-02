class Learner {
  public actions: number[]; // -1 or 1
  public predictions: number[]; // -1 or 1

  // Vectors for learning
  public weights: number[]; 
  public probability: number[];

  public constructor(num) {
    this.actions = [];
    this.predictions = [];
    this.weights = [];
    this.probability = [];

    for (let i = 0; i < num; i++) {
      this.weights.push(0);
      this.probability.push(0.5);
    }
  }

  public addAction(action: number): void {
    this.actions.push(action);

    // update weights vector
    if (action == 1) { // heads
      this.weights[0]++;
    } else { // tails
      this.weights[1]++;
    }

    // update probability vector
    this.probability[0] = this.weights[0] / (this.weights[0] + this.weights[1]);
    this.probability[1] = this.weights[1] / (this.weights[0] + this.weights[1]);

    console.log("updated probabilities:" + this.probability);
  }

  public predict(): number {
    const p = this._predictStupid();
    this.predictions.push(p);

    console.log("user actions:" + this.actions);
    console.log("learner predictions:" + this.predictions);
    console.log("weights:" + this.weights);
    console.log("probability:" + this.probability);
    console.log("");

    return p;
  }

  private _predictSimple(): number {
    let p = -1; // tails
    if (Math.random() < this.probability[0]) {
      p = 1; // heads
    }

    return p;
  }

  private _predictStupid(): number {
    let p = -1; // tails
    if (this.probability[0] > this.probability[1]) {
      p = 1; // heads
    }

    return p;
  }

  private _predictRandom(): number {
    let p = 1; // tails
    if (Math.random() < 0.5) {
      p = -1; // heads
    }
    return p;
  }
}