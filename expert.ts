/******************************************************************************** 
 * Expert: Implements a context-tree expert (a decision tree based on context).
 *         Represents each expert as an n-ary string (labelings for leaves).
 *******************************************************************************/

class Expert {
  public number: number;
  public predictions: string; // labelings for leaves of context tree
  public n: number; // number of actions/strategies

  // Construct expert i (context-tree with n^h leaves)
  public constructor(i: number, n: number, h: number) {
    this.n = n;
    this.number = i; // col number
    this.predictions = i.toString(n);
    while (this.predictions.length < Math.pow(n, h)) { 
      this.predictions = "0" + this.predictions;
    }
  }

  // Prediction of expert i given history (e.g. "101")
  public predict(history: string): number {
    const row = parseInt(history, this.n);
    return parseInt(this.predictions[row]);
  }  
}