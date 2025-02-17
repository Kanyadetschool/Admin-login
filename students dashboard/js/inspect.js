// Disable right-click context menu
document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

// Disable common key combinations used for inspecting
document.addEventListener('keydown', (event) => {
    // List of blocked keys
    const blockedKeys = ['F12', 'I', 'J', 'U', 'C'];
    if (
        event.key === 'F12' || 
        (event.ctrlKey && blockedKeys.includes(event.key)) ||
        (event.ctrlKey && event.shiftKey && ['I', 'C', 'J'].includes(event.key)) || 
        (event.metaKey && event.altKey) // For macOS
    ) {
        event.preventDefault();
        alert('This feature is disabled.');
    }
});

// Detect if Developer Tools is Open
(function detectDevTools() {
    const element = new Image();
    Object.defineProperty(element, 'id', {
        get: function () {
            alert('Developer tools detected! Please close it.');
            setTimeout(() => window.location.reload(), 100); // Optional: Reload page
        }
    });
    console.log('%c', element);
})();

// Continuously check if dev tools are open by measuring execution time
let devToolsOpen = false;
const detectWithDebugger = () => {
    const start = performance.now();
    debugger; // Causes execution to pause if dev tools are open
    const end = performance.now();
    if (end - start > 100) {
        devToolsOpen = true;
        alert('Developer tools detected! Please close it.');
        setTimeout(() => window.location.reload(), 100); // Optional: Reload page
    }
};
setInterval(detectWithDebugger, 1000);

// Prevent dragging of elements
document.addEventListener('dragstart', (event) => event.preventDefault());

// Prevent selecting text
document.addEventListener('selectstart', (event) => event.preventDefault());

// Obfuscate console by overriding functions
const blockConsole = () => {
    const methods = ['log', 'warn', 'info', 'error', 'table', 'clear'];
    methods.forEach((method) => {
        console[method] = () => {};
    });
};
blockConsole();

// Overwrite `toString` to prevent console usage of your functions
window.toString = () => {
    alert('Console usage is disabled.');
    return '';
};

// Detect and prevent iframe inspection
if (window.top !== window.self) {
    alert('Embedding in iframes is disabled.');
    window.top.location = window.self.location;
}

// Prevent browser refresh or closing with onbeforeunload
// window.onbeforeunload = (event) => {
//     event.preventDefault();
//     return 'Are you sure you want to leave?';
// };

// Protect against basic breakpoint tampering
const preventTampering = () => {
    const protect = document.createElement('div');
    Object.defineProperty(protect, 'id', {
        get: function () {
            throw new Error('Tampering detected!');
        }
    });
    setInterval(() => console.log(protect), 1000);
};
preventTampering();
