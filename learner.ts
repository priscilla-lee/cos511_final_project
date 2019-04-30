class Learner {
  public actions: number[]; // -1 or 1
  public predictions: number[]; // -1 or 1

  public constructor() {
    this.actions = [];
    this.predictions = [];
  }

  public addAction(action: number): void {
    this.actions.push(action);
  }

  public predict(): number {
    let p = 1;
    if (Math.random() < 0.5) {
      p = -1;
    }

    this.predictions.push(p);
    return p;
  }
}