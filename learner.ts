class Learner {
  public actions: number[]; // -1 or 1
  public predictions: number[]; // -1 or 1

  public constructor() {
    actions = [];
    predictions = [];
  }

  public addAction(action: number): void {
    actions.push(action);
  }

  public predict(): number {
    p = 1;
    if (Math.random() < 0.5) {
      p = -1;
    }

    predictions.push(p);
    return p;
  }
}