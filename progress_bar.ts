/******************************************************************************** 
 * ProgressBar: Visual component representing the current game score
 *******************************************************************************/

class ProgressBar {
  public ctx;
  public bar: number;
  
  // Constructor: progress bar for "user" or "learner" (POV for point of view)
  public constructor(POV: string, color: string) {
    // Get canvas, set dimensions
    const canvas = <HTMLCanvasElement> document.getElementById(POV + "Canvas");
    canvas.height = 100;
    canvas.width = 100;

    // Set up contex, color, and initial bar
    this.ctx = canvas.getContext("2d");
    this.ctx.fillStyle = color;
    this.bar = 0;
  }

  // Fill the progress bar a little bit (by 1%)
  public fill(): void {
    this.ctx.fillRect(this.bar, 0, 1, 100);
    this.bar++;
  }
}