const vscode = require("vscode");

let startTime = null;
let totalTime = 0;
let statusBarItem = null;
let timerInterval = null;

function activate(context) {
  // Load the total time from the global state
  totalTime = context.globalState.get("totalTime", 0) || 0;

  function startTimer() {
    if (startTime === null) {
      startTime = Date.now();
      startBlinker(); // Start the green blinker
    }
  }

  function stopTimer() {
    if (startTime !== null) {
      const endTime = Date.now();
      totalTime += endTime - startTime;
      startTime = null;
      // Save the total time to the global state
      context.globalState.update("totalTime", totalTime);
      updateStatusBar();
      stopBlinker(); // Stop the green blinker
    }
  }

  function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds} sec`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} min`;
    } else {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hr`;
    }
  }

  function updateStatusBar() {
    if (statusBarItem) {
      statusBarItem.text = `$(primitive-dot) Total Coding Time: ${formatTime(
        totalTime
      )}`;
      statusBarItem.show();
    }
  }

  function startBlinker() {
    if (!timerInterval) {
      timerInterval = setInterval(() => {
        statusBarItem.text = statusBarItem.text.includes("$(primitive-dot)")
          ? `$(debug-breakpoint-unsupported) Total Coding Time: ${formatTime(
              totalTime
            )}`
          : `$(primitive-dot) Total Coding Time: ${formatTime(totalTime)}`;
      }, 500);
    }
  }

  function stopBlinker() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      updateStatusBar();
    }
  }

  // Create the status bar item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  updateStatusBar();

  // Register event listeners for document changes
  vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.contentChanges.length > 0) {
      startTimer();
    }
  });

  // Register event listeners for window focus changes
  vscode.window.onDidChangeWindowState((event) => {
    if (!event.focused) {
      stopTimer();
    }
  });

  // Register the command to show total coding time
  const disposable = vscode.commands.registerCommand(
    "extension.showTotalTime",
    () => {
      vscode.window.showInformationMessage(
        `Total coding time: ${formatTime(totalTime)}`
      );
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(statusBarItem);
}

function deactivate() {
  if (statusBarItem) {
    statusBarItem.dispose();
  }
  if (timerInterval) {
    clearInterval(timerInterval);
  }
}

module.exports = {
  activate,
  deactivate,
};
