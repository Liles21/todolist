class ToDoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.history = [];
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        this.init();
    }

    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.applyDarkMode();
        this.render();
    }

    cacheElements() {
        this.taskInput = document.getElementById('taskInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.dueDate = document.getElementById('dueDate');
        this.addBtn = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.totalTasksDisplay = document.getElementById('totalTasks');
        this.completedTasksDisplay = document.getElementById('completedTasks');
        this.highPriorityDisplay = document.getElementById('highPriorityTasks');
        this.clearBtn = document.getElementById('clearBtn');
        this.undoBtn = document.getElementById('undoBtn');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.searchInput = document.getElementById('searchInput');
        this.darkModeBtn = document.getElementById('darkModeBtn');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.notification = document.getElementById('notification');
    }

    attachEventListeners() {
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        this.clearBtn.addEventListener('click', () => this.clearCompleted());
        this.undoBtn.addEventListener('click', () => this.undo());
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.render();
        });
        this.darkModeBtn.addEventListener('click', () => this.toggleDarkMode());
    }

    addTask() {
        const taskText = this.taskInput.value.trim();
        
        if (taskText === '') {
            this.showNotification('Please enter a task', 'error');
            this.taskInput.focus();
            return;
        }

        const task = {
            id: Date.now(),
            text: taskText,
            completed: false,
            priority: this.prioritySelect.value,
            dueDate: this.dueDate.value,
            createdAt: new Date().toISOString(),
            editedAt: null
        };

        this.saveToHistory();
        this.tasks.unshift(task);
        this.taskInput.value = '';
        this.prioritySelect.value = 'medium';
        this.dueDate.value = '';
        this.saveTasks();
        this.render();
        this.showNotification('Task added successfully!');
    }

    deleteTask(id) {
        this.saveToHistory();
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.render();
        this.showNotification('Task deleted!');
    }

    toggleTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            this.saveToHistory();
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    editTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (!task) return;

        const newText = prompt('Edit task:', task.text);
        if (newText && newText.trim() !== '') {
            this.saveToHistory();
            task.text = newText.trim();
            task.editedAt = new Date().toISOString();
            this.saveTasks();
            this.render();
            this.showNotification('Task updated!');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }

    clearCompleted() {
        if (this.tasks.filter(t => t.completed).length === 0) return;
        if (!confirm('Clear all completed tasks?')) return;
        
        this.saveToHistory();
        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveTasks();
        this.render();
        this.showNotification('Completed tasks cleared!');
    }

    saveToHistory() {
        this.history.push(JSON.parse(JSON.stringify(this.tasks)));
        if (this.history.length > 10) this.history.shift();
        this.undoBtn.disabled = this.history.length === 0;
    }

    undo() {
        if (this.history.length === 0) return;
        this.tasks = this.history.pop();
        this.saveTasks();
        this.render();
        this.showNotification('Undo successful!');
    }

    getFilteredTasks() {
        let filtered = this.tasks;

        switch (this.currentFilter) {
            case 'active':
                filtered = filtered.filter(task => !task.completed);
                break;
            case 'completed':
                filtered = filtered.filter(task => task.completed);
                break;
            case 'high':
                filtered = filtered.filter(task => task.priority === 'high' && !task.completed);
                break;
        }

        if (this.searchQuery) {
            filtered = filtered.filter(task => task.text.toLowerCase().includes(this.searchQuery));
        }

        return filtered;
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const highPriority = this.tasks.filter(task => task.priority === 'high' && !task.completed).length;
        
        this.totalTasksDisplay.textContent = total;
        this.completedTasksDisplay.textContent = completed;
        this.highPriorityDisplay.textContent = highPriority;
        
        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
        this.progressBar.style.width = progress + '%';
        this.progressText.textContent = progress + '% Complete';
        
        this.clearBtn.disabled = completed === 0;
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        this.applyDarkMode();
        localStorage.setItem('darkMode', this.darkMode);
    }

    applyDarkMode() {
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
            this.darkModeBtn.textContent = '☀️';
        } else {
            document.body.classList.remove('dark-mode');
            this.darkModeBtn.textContent = '🌙';
        }
    }

    showNotification(message, type = 'success') {
        this.notification.textContent = message;
        this.notification.className = 'notification show ' + type;
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 3000);
    }

    render() {
        this.updateStats();
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            this.taskList.innerHTML = '';
            this.emptyState.classList.add('show');
            return;
        }

        this.emptyState.classList.remove('show');
        this.taskList.innerHTML = filteredTasks.map(task => this.createTaskElement(task)).join('');
        
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleTask(parseInt(e.target.dataset.id));
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.deleteTask(parseInt(e.target.dataset.id));
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.editTask(parseInt(e.target.dataset.id));
            });
        });
    }

    createTaskElement(task) {
        const dueDateText = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '';
        const priorityEmoji = {
            high: '🔥',
            medium: '⚡',
            low: '✅'
        }[task.priority];

        return `
            <div class="task-item priority-${task.priority} ${task.completed ? 'completed' : ''}">
                <input 
                    type="checkbox" 
                    class="checkbox task-checkbox" 
                    data-id="${task.id}"
                    ${task.completed ? 'checked' : ''}
                >
                <div class="task-content">
                    <span class="task-text">${this.escapeHtml(task.text)}</span>
                    <div class="task-meta">
                        <span class="task-priority ${task.priority}">${priorityEmoji} ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                        ${dueDateText ? `<span class="task-date">📅 ${dueDateText}</span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="edit-btn" data-id="${task.id}">✏️ Edit</button>
                    <button class="delete-btn" data-id="${task.id}">🗑️ Delete</button>
                </div>
            </div>
        `;
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('tasks');
        return saved ? JSON.parse(saved) : [];
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ToDoApp();
});
