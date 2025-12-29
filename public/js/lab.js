// Virtual Lab - Real-time code mirroring with Socket.io
let socket = null;
let currentSession = null;

// Initialize Virtual Lab
function initializeVirtualLab() {
    const serverUrl = window.location.origin;
    socket = io(serverUrl);

    socket.on('connect', () => {
        console.log('Connected to Virtual Lab server');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from Virtual Lab server');
        showNotification('Disconnected from lab session', 'error');
    });

    socket.on('joined-lab', (data) => {
        currentSession = data.sessionCode;
        showNotification('Joined lab session successfully!', 'success');
        
        if (data.currentCode) {
            document.getElementById('code-editor').value = data.currentCode;
        }
        if (data.language) {
            document.getElementById('language-select').value = data.language;
        }
    });

    socket.on('code-mirrored', (data) => {
        const editor = document.getElementById('code-editor');
        // Only update if code is different to prevent cursor jumping
        if (editor.value !== data.code) {
            const cursorPos = editor.selectionStart;
            editor.value = data.code;
            editor.setSelectionRange(cursorPos, cursorPos);
        }
        if (data.language) {
            document.getElementById('language-select').value = data.language;
        }
    });

    socket.on('participant-joined', (data) => {
        showNotification(`${data.userRole} joined the session`, 'info');
    });

    socket.on('participant-left', () => {
        showNotification('Participant left the session', 'info');
    });

    socket.on('participant-disconnected', () => {
        showNotification('Participant disconnected', 'info');
    });

    socket.on('debug-response', (data) => {
        displayDebugResult(data);
    });

    socket.on('code-suggestion-response', (data) => {
        if (data.suggestion) {
            const editor = document.getElementById('code-editor');
            editor.value += '\n\n// AI Suggestion:\n' + data.suggestion;
        } else {
            showNotification('Failed to generate code suggestion', 'error');
        }
    });

    socket.on('error', (data) => {
        showNotification(data.message, 'error');
    });

    // Setup code editor real-time sync
    const codeEditor = document.getElementById('code-editor');
    let typingTimer;
    const typingDelay = 500; // milliseconds

    codeEditor.addEventListener('input', function() {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            if (currentSession && currentUser) {
                const code = codeEditor.value;
                const language = document.getElementById('language-select').value;
                
                socket.emit('code-update', {
                    sessionCode: currentSession,
                    code: code,
                    language: language,
                    userId: currentUser.id
                });
            }
        }, typingDelay);
    });

    // Language change event
    document.getElementById('language-select').addEventListener('change', function() {
        if (currentSession && currentUser) {
            const code = codeEditor.value;
            const language = this.value;
            
            socket.emit('code-update', {
                sessionCode: currentSession,
                code: code,
                language: language,
                userId: currentUser.id
            });
        }
    });
}

// Join lab session
function joinLabSession() {
    const sessionCode = document.getElementById('session-code').value.trim();
    
    if (!sessionCode) {
        showNotification('Please enter a session code', 'error');
        return;
    }

    if (!currentUser) {
        showNotification('Please login first', 'error');
        return;
    }

    if (!socket || !socket.connected) {
        initializeVirtualLab();
        setTimeout(() => {
            joinLabSession();
        }, 1000);
        return;
    }

    socket.emit('join-lab', {
        sessionCode: sessionCode,
        userRole: currentUser.role,
        userId: currentUser.id
    });
}

// Leave lab session
function leaveLabSession() {
    if (currentSession && socket) {
        socket.emit('leave-lab', {
            sessionCode: currentSession
        });
        currentSession = null;
        showNotification('Left lab session', 'info');
    }
}

// Request AI debugging
function requestDebug() {
    if (!currentSession || !socket) {
        showNotification('Please join a lab session first', 'error');
        return;
    }

    const code = document.getElementById('code-editor').value;
    const language = document.getElementById('language-select').value;

    if (!code.trim()) {
        showNotification('Please write some code first', 'error');
        return;
    }

    // For demo purposes, we'll simulate an error detection
    // In a real scenario, this would come from actual code execution
    const errorMessage = 'Please analyze this code for potential issues';

    showNotification('Requesting AI analysis...', 'info');

    socket.emit('debug-request', {
        sessionCode: currentSession,
        errorMessage: errorMessage,
        codeSnippet: code,
        language: language,
        userId: currentUser.id
    });
}

// Display debug result
function displayDebugResult(result) {
    const debugOutput = document.getElementById('debug-output');
    
    const resultHtml = `
        <div class="bg-white/5 p-4 rounded-lg mb-4 border border-purple-500/30">
            <h4 class="font-semibold text-purple-300 mb-2">AI Analysis Result</h4>
            ${result.cause ? `
                <div class="mb-3">
                    <p class="text-sm text-gray-300 font-semibold">Root Cause:</p>
                    <p class="text-sm text-gray-400">${escapeHtml(result.cause)}</p>
                </div>
            ` : ''}
            ${result.fix ? `
                <div class="mb-3">
                    <p class="text-sm text-gray-300 font-semibold">Suggested Fix:</p>
                    <p class="text-sm text-gray-400">${escapeHtml(result.fix)}</p>
                </div>
            ` : ''}
            ${result.bestPractices ? `
                <div>
                    <p class="text-sm text-gray-300 font-semibold">Best Practices:</p>
                    <p class="text-sm text-gray-400">${escapeHtml(result.bestPractices)}</p>
                </div>
            ` : ''}
            ${result.error ? `
                <p class="text-sm text-red-400">${escapeHtml(result.error)}</p>
            ` : ''}
            <p class="text-xs text-gray-500 mt-2">${new Date().toLocaleTimeString()}</p>
        </div>
    `;
    
    debugOutput.innerHTML = resultHtml + debugOutput.innerHTML;
}

// Run code (simulated)
function runCode() {
    const code = document.getElementById('code-editor').value;
    const language = document.getElementById('language-select').value;

    if (!code.trim()) {
        showNotification('Please write some code first', 'error');
        return;
    }

    showNotification(`Running ${language} code...`, 'info');

    // In a real implementation, this would send code to a sandboxed execution environment
    const debugOutput = document.getElementById('debug-output');
    const outputHtml = `
        <div class="bg-green-900/20 p-4 rounded-lg mb-4 border border-green-500/30">
            <h4 class="font-semibold text-green-300 mb-2">Code Execution</h4>
            <p class="text-sm text-gray-300">Language: ${escapeHtml(language)}</p>
            <p class="text-sm text-gray-400 mt-2">Note: Full code execution requires a secure sandbox environment.</p>
            <p class="text-xs text-gray-500 mt-2">${new Date().toLocaleTimeString()}</p>
        </div>
    `;
    
    debugOutput.innerHTML = outputHtml + debugOutput.innerHTML;
}

// Request code suggestion
function requestCodeSuggestion() {
    if (!currentSession || !socket) {
        showNotification('Please join a lab session first', 'error');
        return;
    }

    const description = prompt('Describe what you want to code:');
    if (!description) return;

    const language = document.getElementById('language-select').value;

    showNotification('Generating code suggestion...', 'info');

    socket.emit('code-suggestion-request', {
        description: description,
        language: language
    });
}

// Start a new lab session (for mentors/admins)
function startNewLabSession() {
    if (!currentUser || (currentUser.role !== 'Mentor' && currentUser.role !== 'CenterAdmin')) {
        showNotification('Only mentors and admins can start sessions', 'error');
        return;
    }

    const studentEmail = prompt('Enter student email:');
    if (!studentEmail) return;

    // This would need to fetch the student ID from the backend
    // For demo purposes, we'll show a simplified version
    showNotification('Creating lab session...', 'info');

    fetch('/api/lab/start', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            mentor_id: currentUser.id,
            student_id: studentEmail, // In reality, this would be the student's ID
            project_id: null
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.session) {
            showNotification(`Session created! Code: ${data.session.session_code}`, 'success');
            document.getElementById('session-code').value = data.session.session_code;
        } else {
            showNotification(data.error || 'Failed to create session', 'error');
        }
    })
    .catch(error => {
        showNotification('Failed to create session: ' + error.message, 'error');
    });
}

// Initialize when lab page is shown
document.addEventListener('DOMContentLoaded', function() {
    // Initialize socket connection when needed
    const labPage = document.getElementById('lab-page');
    if (labPage) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (!labPage.classList.contains('hidden') && !socket) {
                    initializeVirtualLab();
                }
            });
        });
        
        observer.observe(labPage, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
});

// Make functions available globally
window.joinLabSession = joinLabSession;
window.leaveLabSession = leaveLabSession;
window.requestDebug = requestDebug;
window.runCode = runCode;
window.requestCodeSuggestion = requestCodeSuggestion;
window.startNewLabSession = startNewLabSession;
