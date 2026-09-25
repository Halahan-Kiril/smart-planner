MobileDragDrop.polyfill({ // MobileDragAndDrop Polyfill library https://www.jsdelivr.com/package/npm/mobile-drag-drop
    holdToDrag: 300,
    // Passt die Position des Drag-Images beim Scrollen auf Touch-Geräten an
    dragImageTranslateOverride: MobileDragDrop.scrollBehaviourDragImageTranslateOverride
});
// requirement for iOS Safari 10.x and higher.
window.addEventListener('touchmove', function() {}, {passive: false});

// As soon as the internet connection is restored, the browser automatically fires this event.
window.ononline = () => {
    // retrieononlinee our saved requests or create an empty array if there are none
//                  |turns string back to JS array   
    let queue = JSON.parse(localStorage.getItem('queue')) || [];
    
    // loop through all saved requests and send them to the server
    //queue.forEach((element) => fetch(element.url, element.options)); 
    queue.forEach((req) => fetch(req.url, req.options)); 
    
    // Clear the queue because all requests have been sent
    localStorage.removeItem('queue');
};

//when html,css loaded
window.onload = () => {
    initTheme();          // Apply saved theme on load
    setupThemeToggle();   // Activate button click handler
    setupDragAndDrop();
    checkAuth();
};

// if fetch returns (network) error - request gets in here
function saveOffline(url, options) {
    let queue = JSON.parse(localStorage.getItem('queue')) || []; // if queue doesnt exist yet(null)/falsy - take empty arr [] | 'queue' - key | turn JSON String back to JS array of objects
    queue.push({ url, options }); // Push the failed request into the array
    localStorage.setItem('queue', JSON.stringify(queue)); // Save it back to the browser's memory | only NOW we create queue in storage | turn JS object into String of JSON format
}

// Generates HTML card for a task object
function createTaskCard(t) { // t - taks object with id, title, status...
    const div = document.createElement('div');
    div.className = 'task';
    div.id = t.id;
    div.draggable = true;

    //`Template Literal` + String Interpolation ${}
        // "this" = <select> element itself, this.value = chosen value
        // 'selected' -> this option is picked per default
    //'${t.id}' in single quotes, because UUID is a string! <small>Deadline: ${t.due_date}</small>
    div.innerHTML = `
        <span class="delete-btn" onclick="deleteTask('${t.id}')">X</span>
        <b>${t.title}</b><br>
        <small>${t.description}</small><br>
        <small>Deadline: ${t.due_date === '0000-00-00' ? '' : t.due_date}</small>

        <select class="status-select" onchange="changeTaskStatus('${t.id}', this.value)"> 
            <option value="todo" ${t.status === 'todo' ? 'selected' : ''}>To Do</option>
            <option value="progress" ${t.status === 'progress' ? 'selected' : ''}>In Progress</option>
            <option value="done" ${t.status === 'done' ? 'selected' : ''}>Done</option>
        </select>
    `;

//drag start > save card's ID in temp storage > use it by Drop
//dataTransfer is a built-in temporary browser storage / clipborad that exists only during a drag-and-drop operation | (key, value)
    div.ondragstart = (e) => e.dataTransfer.setData('text/plain', div.id);// 'text/plain'- MIME type | custom 'id'-key doesnt work on mobiles 

    //using DB status as an HTML-element name | Add a card to the end of the TODO column
    document.getElementById(t.status).appendChild(div);
}

async function loadTasks() {
//    fetch = receive an answer
//    response = HTTP answer
//    response.json() = data
//    tasks = ready-made array 
    let tasks = [];
    try {
        const response = await fetch('api/get_tasks.php'); // server answer (raw) | HTTP Response - not the data yet | its a string yet
        //           | actual Data - ready-made JS array with objects| await because it's also a promise 
        tasks = await response.json(); // json() - Converts(/parses) the HTTP response !!body!! (JSON) into a JS data structure (array) 
        // save a backup copy of the fresh data in case the user goes offline later
        localStorage.setItem('backup', JSON.stringify(tasks)); 
    } catch (error) {
        // If fetch fails (no internet), we grab the backup copy from memory
        tasks = JSON.parse(localStorage.getItem('backup')) || []; //cache available after first success - otherwise no backup - no data
    }
    //clearing all the columns and leaving the header
    document.getElementById('todo').innerHTML = '<h2>To Do</h2>';
    document.getElementById('progress').innerHTML = '<h2>In Progress</h2>';
    document.getElementById('done').innerHTML = '<h2>Done</h2>';

    tasks.forEach(t => createTaskCard(t));
}

// OFFLINE-READY Drag & Drop
function setupDragAndDrop() { // Richtet Drag & Drop für die Spalten ein
    const columns = document.querySelectorAll('.column'); // querySelectorAll - nodeList

    columns.forEach((col) => {
        col.ondragenter = (event) => event.preventDefault(); // neccesary for mobiles (MobileDragDrop polyfill)
        col.ondragover = (event) => event.preventDefault(); // allows to drop an ellement in this column

        col.ondrop = async (event) => {
            event.preventDefault();

            const taskId = event.dataTransfer.getData('text/plain');// retrieves the ID, placed in `ondragstart`
            if (!taskId) return;// just in case if something goes wrong and id is empty

            const card = document.getElementById(taskId);
            col.appendChild(card); // MOVES an element | (in DOM one element can exist only in 1 place)

            //Synchronize the dropdown menu with the new column status
            card.querySelector('.status-select').value = col.id;

            const formData = new FormData();
            formData.append('id', taskId);
            formData.append('status', col.id); //it reads new column's id and sends as a new status

            const options = {
                method: 'POST', // PHP $_POST requires POST-request
                body: formData
            };

            try {
                await fetch('api/update_task.php', options);
            } catch (error) {
                //Queue the visual change if network fails
                saveOffline('api/update_task.php', options);
            }
        };
    });
}

// ====================== CRUD =================
//ADD TASK + UUID
document.getElementById('add-form').onsubmit = async (event) => {
    event.preventDefault(); // prevent page reload

    //Generate a real 36-character UUID directly in the browser
    const newTaskId = crypto.randomUUID(); 

    const taskData = {
        id: newTaskId,
        title: document.getElementById('title').value, // text from input
        description: document.getElementById('desc').value,
        due_date: document.getElementById('date').value,
        status: 'todo'
    };

    const formData = new FormData();
    formData.append('id', taskData.id);
    formData.append('title', taskData.title);
    formData.append('description', taskData.description);
    formData.append('due_date', taskData.due_date);
    formData.append('status', taskData.status);

    const options = {
        method: 'POST',
        body: formData
    };

    //optimisticaly Render the card instantly on screen
    createTaskCard(taskData);

    document.getElementById('add-form').reset(); 

    try {
        await fetch('api/add_task.php', options);
    } catch (error) {
        saveOffline('api/add_task.php', options);
    }
};

async function deleteTask(id) {
    const formData = new FormData();
    formData.append('id', id);

    const options = {
        method: 'POST',
        body: formData
    };

    try {
        await fetch('api/delete_task.php', options);
    } catch (error) {
        saveOffline('api/delete_task.php', options); 
    }
    
    document.getElementById(id).remove(); 
}

// Change status via the drop-down list
async function changeTaskStatus(id, newStatus) {
    const formData = new FormData();
    formData.append('id', id);
    formData.append('status', newStatus);

    const options = {
        method: 'POST',
        body: formData
    };

    try {
        await fetch('api/update_task.php', options);
    } catch (error) {
        saveOffline('api/update_task.php', options);
    }
    
    const card = document.getElementById(id);
    const targetColumn = document.getElementById(newStatus);
    targetColumn.appendChild(card);
}

// =========================== Dark Theme ===========================

// Reads saved preference from LocalStorage and sets initial state
//needed to restore theme preference after reloading page
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const toggleBtn = document.getElementById('theme-toggle');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');

        toggleBtn.innerText = 'Light Mode';
    }
}

// Handles toggle button clicks and saves preference
function setupThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');

    toggleBtn.onclick = () => {
        // Toggle the .dark-mode class on <body>
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        toggleBtn.innerText = isDark ? 'Light Mode' : 'Dark Mode';
    };
}

// --- AUTHENTICATION LOGIC ---
let isRegisterMode = false; // true - registration Screen, false - log in Screen

// DOM Elements
const authScreen = document.getElementById('auth-screen'); //div Auth screen
const appScreen = document.getElementById('app-screen'); // div Main screen
const authForm = document.getElementById('auth-form'); // form Au.S.

const authTitle = document.getElementById('auth-title');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const toggleAuthBtn = document.getElementById('toggle-auth-btn');
const toggleText = document.getElementById('toggle-text');

const authError = document.getElementById('auth-error'); // <p>
const logoutBtn = document.getElementById('logout-btn'); // LogOut from App screen

// Check session on startup
async function checkAuth() {
    try {
        const res = await fetch('api/check_auth.php');
        const data = await res.json();

        if (data.authenticated) {
            showApp();
        } else {
            showAuth();
        }
    } catch (e) { //theoretically should never be the case - try-catch can be commented out
        showAuth();
    }
}

// Toggle between Login / Register modes
toggleAuthBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isRegisterMode = !isRegisterMode;
    authError.textContent = '';

    if (isRegisterMode) {
        authTitle.textContent = 'Sign Up';
        authSubmitBtn.textContent = 'Create Account';
        toggleText.textContent = 'Already have an account?';
        toggleAuthBtn.textContent = 'Log In';
    } else {
        authTitle.textContent = 'Log In';
        authSubmitBtn.textContent = 'Log In';
        toggleText.textContent = "Don't have an account?";
        toggleAuthBtn.textContent = 'Sign Up';
    }
});

// Submit Login/Register form
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.textContent = ''; // clear old err msg

    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    const endpoint = isRegisterMode ? 'api/register.php' : 'api/login.php';

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            showApp();
        } else {
            authError.textContent = data.message || 'Login failed. Please try again.';
        }
    } catch (err) {
        authError.textContent = 'Server is currently unreachable. Please try again later.';
    }
});

// Logout Button
logoutBtn.addEventListener('click', async () => {
    await fetch('api/logout.php');
    //clearing private data
    localStorage.removeItem('backup');
    localStorage.removeItem('queue');
    // clearing left out text (just in case)
    document.getElementById('add-form').reset();
    // clearing the board
    document.getElementById('todo').innerHTML = '<h2>To Do</h2>';
    document.getElementById('progress').innerHTML = '<h2>In Progress</h2>';
    document.getElementById('done').innerHTML = '<h2>Done</h2>';

    showAuth();
});

function showApp() {
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    loadTasks();
}

function showAuth() {
    appScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
}