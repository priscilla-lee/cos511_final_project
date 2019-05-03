class Expert {
  public number: number;
  public predictions: string;
  public num_actions: number;

  // Construct expert i
  public constructor(i, n_actions, history_length) {
    this.num_actions = n_actions;
    this.number = i; // col number
    this.predictions = i.toString(n_actions);
    while (this.predictions.length < Math.pow(n_actions, history_length)) { 
      this.predictions = "0" + this.predictions;
    }
  }

  // Prediction of expert i given history (e.g. "101")
  public predict(history: string): number {
    const row = parseInt(history, this.num_actions);
    return parseInt(this.predictions[row]);
  }  
}