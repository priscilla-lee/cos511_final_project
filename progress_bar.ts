class ProgressBar {
  public canvas;
  public ctx;
  public bar: number;

  public constructor(canvas) {
    canvas = document.getElementById("canvas");
    canvas.height = 100;
    canvas.width = 200;

    // Draw center line
    ctx = canvas.getContext("2d");
    this.drawCenterLine();
    bar = 100;
  }

  public drawCenterLine(): void {
    ctx.lineWidth = 0.5;
    ctx.moveTo(100.5, 0);
    ctx.lineTo(100.5, 100);
    ctx.stroke();
  }

  public userWins(): void {
    bar = bar - 10;

    if (bar < 100) {
      ctx.fillStyle = "blue";
    } else {
      ctx.fillStyle = "white";
    }

    ctx.fillRect(bar, 0, 10, 100);
    this.drawCenterLine();
  }

  public learnerWins(): void {
    bar = bar + 10;

    if (bar > 100) {
      ctx.fillStyle = "red";
    } else {
      ctx.fillStyle = "white";
    }

    ctx.fillRect(bar-10, 0, 10, 100);
    this.drawCenterLine();
  }
}