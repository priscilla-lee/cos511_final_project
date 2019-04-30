class ProgressBar {
  public ctx;
  public bar: number;

  public constructor() {
    const canvas = <HTMLCanvasElement> document.getElementById("canvas");
    canvas.height = 100;
    canvas.width = 200;

    // Draw center line
    this.ctx = canvas.getContext("2d");
    this.drawCenterLine();
    this.bar = 100;
  }

  public drawCenterLine(): void {
    this.ctx.lineWidth = 0.5;
    this.ctx.moveTo(100.5, 0);
    this.ctx.lineTo(100.5, 100);
    this.ctx.stroke();
  }

  public userWins(): void {
    this.bar = this.bar - 10;

    if (this.bar < 100) {
      this.ctx.fillStyle = "blue";
    } else {
      this.ctx.fillStyle = "white";
    }

    this.ctx.fillRect(this.bar, 0, 10, 100);
    this.drawCenterLine();
  }

  public learnerWins(): void {
    this.bar = this.bar + 10;

    if (this.bar > 100) {
      this.ctx.fillStyle = "red";
    } else {
      this.ctx.fillStyle = "white";
    }

    this.ctx.fillRect(this.bar-10, 0, 10, 100);
    this.drawCenterLine();
  }
}