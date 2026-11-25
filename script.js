
// Get the required HTML elements
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const errorMessage = document.getElementById("error-message");
const taskCounter = document.getElementById("task-counter");
const emptyMessage = document.getElementById("empty-message");

// Get all filter buttons
const filterButtons = document.querySelectorAll("[data-filter]");

// Variables for storing tasks and the selected filter
const STORAGE_KEY = "tasks";
let tasks = loadTasks();
let currentFilter = "all";

// Load and validate saved tasks from localStorage
function loadTasks() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
      return [];
    }

    const parsedData = JSON.parse(savedData);

    // Check that the saved data is an array
    if (!Array.isArray(parsedData)) {
      return [];
    }

    const validTasks = [];
    const usedIds = new Set();

    // Keep only tasks with valid data
    parsedData.forEach(function(task) {
      if (
        task &&
        typeof task === "object" &&
        (typeof task.id === "string" ||
         typeof task.id === "number") &&
        typeof task.text === "string" &&
        typeof task.completed === "boolean" &&
        task.text.trim().length >= 3
      ) {
        let id = task.id;

        // Replace duplicate IDs to avoid deleting the wrong task
        if (usedIds.has(String(id))) {
          id = createTaskId();
        }

        usedIds.add(String(id));

        validTasks.push({
          id: id,
          text: task.text.trim(),
          completed: task.completed
        });
      }
    });

    return validTasks;

  } catch (error) {
    // Prevent corrupted saved data from stopping the application
    console.warn("Could not load saved tasks:", error);
    return [];
  }
}

// Save tasks to browser storage
function saveTasks() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(tasks)
    );
  } catch (error) {
    // The application can still work if storage is unavailable
    console.error("Could not save tasks:", error);
  }
}

// Generate a unique ID for every new task
function createTaskId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  // Fallback for browsers without randomUUID support
  return Date.now() + "-" +
    Math.random().toString(36).slice(2);
}

// Update the visual and accessible states of filter buttons
function updateFilterButtons() {
  filterButtons.forEach(function(button) {
    const isSelected =
      button.dataset.filter === currentFilter;

    button.classList.toggle("active", isSelected);
    button.setAttribute(
      "aria-pressed",
      String(isSelected)
    );
  });
}

// Display tasks on the page
function displayTasks() {

  // Save the current task list
  saveTasks();

  // Clear the existing displayed tasks
  taskList.innerHTML = "";

  // Select tasks according to the active filter
  const filteredTasks = tasks.filter(function(task) {

    if (currentFilter === "active") {
      return !task.completed;
    }

    if (currentFilter === "completed") {
      return task.completed;
    }

    return true;
  });

  // Create and display each task
  filteredTasks.forEach(function(task, index) {

    const listItem = document.createElement("li");
    listItem.classList.add("task-card");

    // Add completed styling when necessary
    if (task.completed) {
      listItem.classList.add("completed");
    }

    // Create the task description
    const taskText = document.createElement("p");
    taskText.textContent = task.text;

    // Create the task action container
    const actions = document.createElement("div");
    actions.classList.add("task-actions");

    // Create the completion checkbox
    const label = document.createElement("label");
    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.checked = task.completed;

    // Give each checkbox a meaningful accessible label
    checkbox.setAttribute(
      "aria-label",
      "Mark " + task.text + " as completed"
    );

    // Update task completion when checkbox changes
    checkbox.addEventListener("change", function() {
      task.completed = checkbox.checked;
      displayTasks();
    });

    label.appendChild(checkbox);
    label.appendChild(
      document.createTextNode("Completed")
    );

    // Create the delete button
    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("delete-button");

    deleteButton.setAttribute(
      "aria-label",
      "Delete task: " + task.text
    );

    // Delete the selected task
    deleteButton.addEventListener("click", function() {

      tasks = tasks.filter(function(item) {
        return item.id !== task.id;
      });

      displayTasks();
    });

    // Add actions to the task card
    actions.appendChild(label);
    actions.appendChild(deleteButton);

    // Add task content to the list item
    listItem.appendChild(taskText);
    listItem.appendChild(actions);

    // Display the task on the page
    taskList.appendChild(listItem);
  });

  // Count tasks that are not completed
  const remainingTasks = tasks.filter(function(task) {
    return !task.completed;
  }).length;

  // Update the task counter
  taskCounter.textContent =
    remainingTasks +
    (remainingTasks === 1
      ? " task remaining"
      : " tasks remaining");

  // Display an appropriate empty-list message
  if (filteredTasks.length === 0) {

    emptyMessage.style.display = "block";

    if (currentFilter === "active" && tasks.length > 0) {
      emptyMessage.textContent = "No active tasks!";

    } else if (
      currentFilter === "completed" &&
      tasks.length > 0
    ) {
      emptyMessage.textContent =
        "No completed tasks yet!";

    } else {
      emptyMessage.textContent =
        "No tasks yet. Add your first task!";
    }

  } else {
    emptyMessage.style.display = "none";
  }

  // Keep filter buttons updated
  updateFilterButtons();
}

// Validate and add a new task
taskForm.addEventListener("submit", function(event) {

  // Prevent the page from refreshing
  event.preventDefault();

  // Remove unnecessary spaces
  const taskText = taskInput.value.trim();

  // Check that the task contains at least 3 characters
  if (taskText.length < 3) {

    errorMessage.textContent =
      "Please enter a task with at least 3 characters.";

    taskInput.classList.add("invalid");
    taskInput.setAttribute("aria-invalid", "true");

    taskInput.focus();

    return;
  }

  // Clear validation errors
  errorMessage.textContent = "";
  taskInput.classList.remove("invalid");
  taskInput.setAttribute("aria-invalid", "false");

  // Create a new task object
  const newTask = {
    id: createTaskId(),
    text: taskText,
    completed: false
  };

  // Add the task to the array
  tasks.push(newTask);

  // Clear the input field
  taskInput.value = "";

  // Show all tasks so the newly added task is visible
  currentFilter = "all";

  // Update the displayed task list
  displayTasks();
});

// Clear the error message when the user edits the input
taskInput.addEventListener("input", function() {

  errorMessage.textContent = "";

  taskInput.classList.remove("invalid");

  taskInput.setAttribute("aria-invalid", "false");
});

// Filter tasks by their completion status
filterButtons.forEach(function(button) {

  button.addEventListener("click", function() {

    // Get the selected filter
    currentFilter = button.dataset.filter;

    // Refresh the displayed tasks
    displayTasks();
  });
});

// Display saved tasks when the application opens
displayTasks();
