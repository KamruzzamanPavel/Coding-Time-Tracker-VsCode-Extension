// const vscode = require("vscode");

// let startTime = null;
// let totalTime = 0;
// let statusBarItem = null;
// let timerInterval = null;
// let fileTimes = {}; // Object to track time spent on each file
// let activeFile = null; // Keep track of the active file

// function activate(context) {
//   // Load the total time and file-specific times from the global state
//   totalTime = context.globalState.get("totalTime", 0) || 0;
//   fileTimes = context.globalState.get("fileTimes", {}) || {};

//   function startTimer(fileName) {
//     if (startTime === null) {
//       startTime = Date.now();
//       activeFile = fileName;
//       if (!fileTimes[fileName]) {
//         fileTimes[fileName] = 0;
//       }
//       startBlinker(); // Start the blinker
//       startUpdateInterval(); // Start the real-time update
//     }
//   }

//   function stopTimer(fileName) {
//     if (startTime !== null && activeFile === fileName) {
//       const endTime = Date.now();
//       const timeSpent = endTime - startTime;
//       totalTime += timeSpent;
//       fileTimes[fileName] += timeSpent;
//       startTime = null;
//       activeFile = null;
//       // Save the total time and file-specific times to the global state
//       context.globalState.update("totalTime", totalTime);
//       context.globalState.update("fileTimes", fileTimes);
//       stopUpdateInterval(); // Stop the real-time update
//       stopBlinker(); // Stop the blinker
//     }
//   }

//   function formatTime(milliseconds) {
//     const totalSeconds = Math.floor(milliseconds / 1000);
//     const hours = Math.floor(totalSeconds / 3600);
//     const minutes = Math.floor((totalSeconds % 3600) / 60);
//     const seconds = totalSeconds % 60;

//     return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
//       2,
//       "0"
//     )}:${String(seconds).padStart(2, "0")}`;
//   }

//   function updateStatusBar() {
//     if (statusBarItem) {
//       const currentFile = vscode.window.activeTextEditor?.document.fileName;
//       const currentTime = totalTime + (startTime ? Date.now() - startTime : 0);
//       statusBarItem.text = `$(circle-filled) Total Coding Time: ${formatTime(
//         currentTime
//       )}`;
//       statusBarItem.show();
//     }
//   }

//   function startBlinker() {
//     if (!timerInterval) {
//       timerInterval = setInterval(() => {
//         statusBarItem.text = statusBarItem.text.includes("$(circle-filled)")
//           ? `$(circle-outline) Total Coding Time: ${formatTime(
//               totalTime + (startTime ? Date.now() - startTime : 0)
//             )}`
//           : `$(circle-filled) Total Coding Time: ${formatTime(
//               totalTime + (startTime ? Date.now() - startTime : 0)
//             )}`;
//       }, 500);
//     }
//   }

//   function stopBlinker() {
//     if (timerInterval) {
//       clearInterval(timerInterval);
//       timerInterval = null;
//       updateStatusBar();
//     }
//   }

//   function startUpdateInterval() {
//     if (!timerInterval) {
//       timerInterval = setInterval(updateStatusBar, 1000); // Update every second
//     }
//   }

//   function stopUpdateInterval() {
//     if (timerInterval) {
//       clearInterval(timerInterval);
//       timerInterval = null;
//       updateStatusBar(); // Final update when the timer stops
//     }
//   }

//   // Create the status bar item
//   statusBarItem = vscode.window.createStatusBarItem(
//     vscode.StatusBarAlignment.Right,
//     100
//   );
//   updateStatusBar();

//   // Register event listeners for document changes
//   vscode.workspace.onDidChangeTextDocument((event) => {
//     const fileName = event.document.fileName;
//     if (event.contentChanges.length > 0) {
//       startTimer(fileName);
//     }
//   });

//   // Register event listener for document save
//   vscode.workspace.onDidSaveTextDocument((document) => {
//     const fileName = document.fileName;
//     stopTimer(fileName);
//   });

//   // Register event listeners for window focus changes
//   vscode.window.onDidChangeWindowState((event) => {
//     const currentFile = vscode.window.activeTextEditor?.document.fileName;
//     if (!event.focused) {
//       stopTimer(currentFile);
//     }
//   });

//   // Register event listener for active text editor change (tab change)
//   vscode.window.onDidChangeActiveTextEditor((editor) => {
//     if (editor && activeFile) {
//       stopTimer(activeFile); // Stop the timer when switching tabs
//     }
//   });

//   // Command to show time spent on specific files
//   const disposable = vscode.commands.registerCommand(
//     "extension.showFileTime",
//     () => {
//       const panel = vscode.window.createWebviewPanel(
//         "fileTimeView",
//         "File-Specific Coding Time",
//         vscode.ViewColumn.One,
//         {}
//       );

//       let html = "<h1>Time Spent on Each File</h1><ul>";
//       for (const [fileName, time] of Object.entries(fileTimes)) {
//         html += `<li>${fileName}: ${formatTime(time)}</li>`;
//       }
//       html += "</ul>";

//       panel.webview.html = html;
//     }
//   );

//   context.subscriptions.push(disposable);

//   // Automatically show the status bar item on activation
//   statusBarItem.show();
//   context.subscriptions.push(statusBarItem);
// }

// function deactivate() {
//   if (statusBarItem) {
//     statusBarItem.dispose();
//   }
//   if (timerInterval) {
//     clearInterval(timerInterval);
//   }
// }

// module.exports = {
//   activate,
//   deactivate,
// };
const vscode = require("vscode");

let startTime = null;
let totalTime = 0;
let statusBarItem = null;
let timerInterval = null;
let fileTimes = {}; // Track time spent on each file
let projectTimes = {}; // Track time spent on each project
let activeFile = null; // Track the currently active file
let currentProject = null; // Track the current project

function activate(context) {
  // Load the project times and file times from the global state
  projectTimes = context.globalState.get("projectTimes", {}) || {};
  fileTimes = context.globalState.get("fileTimes", {}) || {};

  function getProjectName() {
    const folders = vscode.workspace.workspaceFolders;
    return folders ? folders[0].name : "Unknown Project";
  }

  function getFileName(document) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (workspaceFolder) {
      return document.fileName.replace(workspaceFolder.uri.fsPath + "/", "");
    }
    return document.fileName;
  }

  function startTimer(fileName) {
    if (startTime === null) {
      startTime = Date.now();
      activeFile = fileName;
      currentProject = getProjectName();

      if (!projectTimes[currentProject]) {
        projectTimes[currentProject] = 0;
      }

      startBlinker(); // Start the green blinker
      startUpdateInterval(); // Start the real-time update
    }
  }

  function stopTimer(fileName) {
    if (startTime !== null && activeFile === fileName) {
      const endTime = Date.now();
      const timeSpent = endTime - startTime;
      projectTimes[currentProject] += timeSpent;
      fileTimes[fileName] = (fileTimes[fileName] || 0) + timeSpent;
      startTime = null;
      activeFile = null;

      // Save the project times and file times to the global state
      context.globalState.update("projectTimes", projectTimes);
      context.globalState.update("fileTimes", fileTimes);

      stopUpdateInterval(); // Stop the real-time update
      stopBlinker(); // Stop the green blinker
    }
  }

  function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  }

  function updateStatusBar() {
    if (statusBarItem) {
      const currentTime =
        projectTimes[currentProject] + (startTime ? Date.now() - startTime : 0);
      statusBarItem.text = `$(circle-filled) ${currentProject} Time: ${formatTime(
        currentTime
      )}`;
      statusBarItem.show();
    }
  }

  function startBlinker() {
    if (!timerInterval) {
      timerInterval = setInterval(() => {
        statusBarItem.text = statusBarItem.text.includes("$(circle-filled)")
          ? `$(circle-outline) ${currentProject} Time: ${formatTime(
              projectTimes[currentProject] +
                (startTime ? Date.now() - startTime : 0)
            )}`
          : `$(circle-filled) ${currentProject} Time: ${formatTime(
              projectTimes[currentProject] +
                (startTime ? Date.now() - startTime : 0)
            )}`;
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

  function startUpdateInterval() {
    if (!timerInterval) {
      timerInterval = setInterval(updateStatusBar, 1000); // Update every second
    }
  }

  function stopUpdateInterval() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      updateStatusBar(); // Final update when the timer stops
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
    const fileName = getFileName(event.document);
    if (event.contentChanges.length > 0) {
      startTimer(fileName);
    }
  });

  // Register event listener for document save
  vscode.workspace.onDidSaveTextDocument((document) => {
    const fileName = getFileName(document);
    stopTimer(fileName);
  });

  // Register event listeners for window focus changes
  vscode.window.onDidChangeWindowState((event) => {
    const currentFile = vscode.window.activeTextEditor?.document.fileName;
    if (!event.focused) {
      stopTimer(currentFile);
    }
  });

  // Register event listener for active text editor change (tab change)
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor && activeFile) {
      stopTimer(activeFile); // Stop the timer when switching tabs
      if (editor.document) {
        startTimer(getFileName(editor.document)); // Start the timer for the new tab
      }
    }
  });

  // Command to show time spent on specific files
  const showFileTimeCommand = vscode.commands.registerCommand(
    "extension.showFileTime",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "fileTimeView",
        "File-Specific Coding Time",
        vscode.ViewColumn.One,
        {}
      );

      let html = '<h2 style="color:green;">Time Spent on Each File</h2><ul>';
      const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;

      for (const [fileName, time] of Object.entries(fileTimes)) {
        if (fileName.startsWith(workspaceFolder)) {
          html += `<li style="color: yellow; font-weight:bold">${fileName.replace(
            workspaceFolder + "/",
            ""
          )}: ${formatTime(time)}</li>`;
        }
      }
      html += "</ul>";

      panel.webview.html = html;
    }
  );

  context.subscriptions.push(showFileTimeCommand);

  // Command to show time spent on specific projects
  const showProjectTimeCommand = vscode.commands.registerCommand(
    "extension.showProjectTime",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "projectTimeView",
        "Project-Specific Coding Time",
        vscode.ViewColumn.One,
        {}
      );

      let html = '<h1 style="color: red;">Time Spent on Each Project</h1><ul>';
      for (const [projectName, time] of Object.entries(projectTimes)) {
        html += `<li style="color: orange;">${projectName}: ${formatTime(
          time
        )}</li>`;
      }
      html += "</ul>";

      panel.webview.html = html;
    }
  );

  context.subscriptions.push(showProjectTimeCommand);

  // Automatically show the status bar item on activation
  statusBarItem.show();
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
