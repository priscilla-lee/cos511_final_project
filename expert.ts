class Expert {
  public number: number;
  public predictions: string;

  // Construct expert i
  public constructor(i) {
    this.number = i; // col number
    this.predictions = i.toString(2); // binary
    while (this.predictions.length < 8) {
      this.predictions = "0" + this.predictions;
    }
  }

  // Prediction of expert i given history (e.g. "101")
  public predict(history: string): number {
    const row = parseInt(history, 2); // row number
    return parseInt(this.predictions[row]);
  }  
}