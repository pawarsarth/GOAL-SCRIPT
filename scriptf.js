// Initialize DOM elements for calendar, task management, and stats
const calendarBody = document.getElementById('calendar-body');
const taskList = document.getElementById('taskList');
const xpCounter = document.getElementById('xpCounter');
const streakCounter = document.getElementById('streakCounter');
const badges = [
    document.getElementById('badge1'),
    document.getElementById('badge2'),
    document.getElementById('badge3')
];

// Initialize state variables for tracking user progress
let xp = 0;
let streak = 0;
let streakUpdatedToday = false;
let tasks = [];
let dailyData = Array(7).fill(0);
let monthlyData = Array(12).fill(0);
let dailyGrowthChart, monthlyGrowthChart;

// Calendar setup variables
const currentDate = new Date();
const currentMonth = currentDate.getMonth();
const currentYear = currentDate.getFullYear();
const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

function formatTime(time) {
    const [hour, minute] = time.split(':');
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minute} ${period}`;
}

function setupCalendar() {
    const monthDays = [];
    for (let i = 0; i < firstDayIndex; i++) {
        monthDays.push('');
    }
    for (let i = 1; i <= daysInMonth; i++) {
        monthDays.push(i);
    }
    while (monthDays.length % 7 !== 0) {
        monthDays.push('');
    }

    for (let i = 0; i < monthDays.length; i += 7) {
        const week = monthDays.slice(i, i + 7);
        const row = document.createElement('tr');
        week.forEach(day => {
            const cell = document.createElement('td');
            if (day !== '') {
                cell.innerHTML = `<div class="date">${day}</div><div class="task-container" id="day-${day}"></div>`;
            }
            row.appendChild(cell);
        });
        calendarBody.appendChild(row);
    }
}

function isTimeConflict(newStart, newEnd, excludeTask = null) {
    const newStartTime = new Date(`2000-01-01T${newStart}`);
    const newEndTime = new Date(`2000-01-01T${newEnd}`);

    return tasks.some(task => {
        if (excludeTask && task.name === excludeTask.name && 
            task.startTime === excludeTask.startTime && 
            task.endTime === excludeTask.endTime) {
            return false;
        }

        const taskStart = new Date(`2000-01-01T${task.startTime}`);
        const taskEnd = new Date(`2000-01-01T${task.endTime}`);

        return (newStartTime >= taskStart && newStartTime < taskEnd) ||
               (newEndTime > taskStart && newEndTime <= taskEnd) ||
               (newStartTime <= taskStart && newEndTime >= taskEnd);
    });
}

function addTask() {
    const taskInput = document.getElementById('taskInput');
    const startTime = document.getElementById('startTime');
    const endTime = document.getElementById('endTime');
    const task = taskInput.value.trim();

    if (!task || !startTime.value || !endTime.value) {
        showError('Please enter all task details.');
        return;
    }

    if (startTime.value >= endTime.value) {
        showError('End time must be after start time.');
        return;
    }

    if (isTimeConflict(startTime.value, endTime.value)) {
        showError('This time slot conflicts with an existing task.');
        return;
    }

    const taskObj = {
        name: task,
        startTime: startTime.value,
        endTime: endTime.value,
        completed: false
    };

    tasks.push(taskObj);

    // Create task elements
    createTaskElement(taskObj);
    createTaskListItem(taskObj);

    taskInput.value = '';
    startTime.value = '';
    endTime.value = '';
    clearError();
}

function createTaskElement(taskObj) {
    const day = currentDate.getDate();
    const taskContainer = document.getElementById(`day-${day}`);
    
    if (taskContainer) {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task');
        taskElement.setAttribute('data-task', taskObj.name);
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = taskObj.completed;
        checkbox.onchange = () => completeTask(checkbox, taskObj);

        const taskContent = document.createElement('span');
        taskContent.textContent = `${taskObj.name} (${formatTime(taskObj.startTime)} - ${formatTime(taskObj.endTime)})`;

        const buttonsContainer = document.createElement('div');
        buttonsContainer.classList.add('task-buttons');

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.classList.add('edit');
        editButton.onclick = () => editTask(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => deleteTask(deleteButton);

        buttonsContainer.appendChild(editButton);
        buttonsContainer.appendChild(deleteButton);

        taskElement.appendChild(checkbox);
        taskElement.appendChild(taskContent);
        taskElement.appendChild(buttonsContainer);

        if (taskObj.completed) {
            taskElement.classList.add('task-completed');
            editButton.style.display = 'none';
            deleteButton.style.display = 'none';
        }

        taskContainer.appendChild(taskElement);
    }
}

function createTaskListItem(taskObj) {
    const taskItem = document.createElement('div');
    taskItem.classList.add('task-item');
    taskItem.setAttribute('data-task', taskObj.name);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = taskObj.completed;
    checkbox.onchange = () => completeTask(checkbox, taskObj);

    const taskContent = document.createElement('span');
    taskContent.textContent = `${taskObj.name} (${formatTime(taskObj.startTime)} - ${formatTime(taskObj.endTime)})`;

    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('task-buttons');

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.classList.add('edit');
    editButton.onclick = () => editTask(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = () => deleteTask(deleteButton);

    buttonsContainer.appendChild(editButton);
    buttonsContainer.appendChild(deleteButton);

    taskItem.appendChild(checkbox);
    taskItem.appendChild(taskContent);
    taskItem.appendChild(buttonsContainer);

    if (taskObj.completed) {
        taskItem.classList.add('task-completed');
        editButton.style.display = 'none';
        deleteButton.style.display = 'none';
    }

    taskList.appendChild(taskItem);
}

function completeTask(checkbox, taskObj) {
    const XP_POINTS = 20;
    const taskValue = checkbox.checked ? 1 : -1;
    
    // Update task completion status
    taskObj.completed = checkbox.checked;
    
    // Find all related task elements
    const taskElements = document.querySelectorAll(`[data-task="${taskObj.name}"]`);
    
    taskElements.forEach(element => {
        const buttonsContainer = element.querySelector('.task-buttons');
        const editButton = buttonsContainer.querySelector('.edit');
        const deleteButton = buttonsContainer.querySelector('button:not(.edit)');
        
        if (checkbox.checked) {
            element.classList.add('task-completed');
            editButton.style.display = 'none';
            deleteButton.style.display = 'none';
        } else {
            element.classList.remove('task-completed');
            editButton.style.display = 'inline-block';
            deleteButton.style.display = 'inline-block';
        }
        
        // Sync checkbox state
        const elementCheckbox = element.querySelector('input[type="checkbox"]');
        if (elementCheckbox !== checkbox) {
            elementCheckbox.checked = checkbox.checked;
        }
    });

    // Update XP and other stats
    xp = Math.max(0, xp + (XP_POINTS * taskValue));
    xpCounter.textContent = `XP: ${xp}`;
    
    updateBadges();
    if (checkbox.checked) {
        updateStreak();
    }
    updateChartData(taskValue);
}

function updateBadges() {
    const badgeThresholds = [40, 60, 80];
    badges.forEach((badge, index) => {
        if (xp >= badgeThresholds[index]) {
            badge.classList.add('unlocked');
            badge.classList.remove('blur');
        } else {
            badge.classList.remove('unlocked');
            badge.classList.add('blur');
        }
    });
}

function updateStreak() {
    const day = currentDate.getDate();
    const taskContainer = document.getElementById(`day-${day}`);
    
    if (taskContainer && !streakUpdatedToday) {
        streak++;
        streakCounter.textContent = `Streak: ${streak}`;
        streakUpdatedToday = true;
    }
}

function updateChartData(taskValue) {
    const today = new Date();
    const dayIndex = today.getDay();
    const monthIndex = today.getMonth();
    
    dailyData[dayIndex] = Math.max(0, dailyData[dayIndex] + taskValue);
    monthlyData[monthIndex] = Math.max(0, monthlyData[monthIndex] + taskValue);

    updateChartDisplay();
}

function updateChartDisplay() {
    dailyGrowthChart.data.datasets[0].data = dailyData;
    dailyGrowthChart.update();
    
    monthlyGrowthChart.data.datasets[0].data = monthlyData;
    monthlyGrowthChart.update();
}

function deleteTask(button) {
    const taskItem = button.closest('.task-item') || button.closest('.task');
    const taskText = taskItem.getAttribute('data-task');
    
    // Find the task in the tasks array
    const task = tasks.find(t => t.name === taskText);
    
    // Check if task is completed
    if (task && task.completed) {
        alert('Cannot delete a completed task!');
        return;
    }

    // Remove task from tasks array
    tasks = tasks.filter(t => t.name !== taskText);

    // Remove task elements from both calendar and task list
    const taskElements = document.querySelectorAll(`[data-task="${taskText}"]`);
    taskElements.forEach(element => element.remove());

    // No longer decrease XP when deleting a task
    updateChartData(-1); // Still update the charts to reflect the task removal
}

function editTask(button) {
    const taskItem = button.closest('.task-item') || button.closest('.task');
    const taskText = taskItem.getAttribute('data-task');
    
    // Find the task in the tasks array
    const task = tasks.find(t => t.name === taskText);
    
    // Check if task is completed
    if (task && task.completed) {
        alert('Cannot edit a completed task!');
        return;
    }

    const newTask = prompt('Edit task:', task.name);
    const newStartTime = prompt('Edit start time (HH:MM):', task.startTime);
    const newEndTime = prompt('Edit end time (HH:MM):', task.endTime);

    if (newTask && newStartTime && newEndTime) {
        if (newStartTime >= newEndTime) {
            alert('End time must be after start time.');
            return;
        }

        if (isTimeConflict(newStartTime, newEndTime, task)) {
            alert('This time slot conflicts with an existing task.');
            return;
        }

        // Update task in tasks array
        task.name = newTask;
        task.startTime = newStartTime;
        task.endTime = newEndTime;

        // Update task elements
        const taskElements = document.querySelectorAll(`[data-task="${taskText}"]`);
        taskElements.forEach(element => {
            element.setAttribute('data-task', newTask);
            const span = element.querySelector('span');
            span.textContent = `${newTask} (${formatTime(newStartTime)} - ${formatTime(newEndTime)})`;
        });
    }
}

function showError(message) {
    let errorDiv = document.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        document.querySelector('.task-input').appendChild(errorDiv);
    }
    errorDiv.textContent = message;
}

function clearError() {
    const errorDiv = document.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function createCharts() {
    const dailyCtx = document.getElementById('dailyGrowthChart').getContext('2d');
    dailyGrowthChart = new Chart(dailyCtx, {
        type: 'line',
        data: {
            labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            datasets: [{
                label: 'Daily Tasks',
                data: dailyData,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });

    const monthlyCtx = document.getElementById('monthlyGrowthChart').getContext('2d');
    monthlyGrowthChart = new Chart(monthlyCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Monthly Tasks',
                data: monthlyData,
                backgroundColor: '#4CAF50'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function resetDailyStreak() {
    const now = new Date();
    const night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 0
    );
    const msToMidnight = night.getTime() - now.getTime();

    setTimeout(() => {
        streakUpdatedToday = false;
        resetDailyStreak();
    }, msToMidnight);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    setupCalendar();
    createCharts();
    resetDailyStreak();
});