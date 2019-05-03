class ProgressBar {
  public ctx;
  public bar: number;
  
  public constructor(POV: String, color: String) {
    const canvas = <HTMLCanvasElement> document.getElementById(POV + "Canvas");
    canvas.height = 100;
    canvas.width = 100;

    this.ctx = canvas.getContext("2d");
    this.ctx.fillStyle = color;
    this.bar = 0;
  }

  public fill(): void {
    this.ctx.fillRect(this.bar, 0, 1, 100);
    this.bar++;
  }
}