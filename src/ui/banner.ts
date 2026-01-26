import figlet from "figlet";
import pc from "picocolors";

export async function showBanner(): Promise<void> {
  return new Promise((resolve, reject) => {
    figlet.text(
      "ATARI",
      {
        font: "ANSI Shadow",
        horizontalLayout: "default",
        verticalLayout: "default",
      },
      (err, data) => {
        if (err) {
          // Fallback to simple text if figlet fails
          console.log(pc.bold(pc.red("\n  ATARI ARCADE\n")));
          resolve();
          return;
        }
        console.log(pc.red(data));
        console.log(pc.dim("  Retro games in your terminal\n"));
        resolve();
      }
    );
  });
}
