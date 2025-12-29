// Content Shield - Anti-theft JavaScript Protection
(function() {
    'use strict';

    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
        if (window.currentUser) {
            e.preventDefault();
            showNotification('Content is protected', 'info');
        }
    });

    // Disable common keyboard shortcuts for copying/inspecting
    document.addEventListener('keydown', function(e) {
        // Disable F12 (DevTools)
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        
        // Disable Ctrl+Shift+I (DevTools)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }
        
        // Disable Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }
        
        // Disable Ctrl+U (View Source)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
        
        // Disable Ctrl+S (Save)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }
        
        // Disable Ctrl+C (Copy) on protected content
        if (e.ctrlKey && e.keyCode === 67) {
            const selection = window.getSelection();
            if (selection && selection.toString().length > 0) {
                const protectedElements = document.querySelectorAll('.content-protected');
                let isProtected = false;
                
                protectedElements.forEach(element => {
                    if (element.contains(selection.anchorNode)) {
                        isProtected = true;
                    }
                });
                
                if (isProtected) {
                    e.preventDefault();
                    showNotification('This content is protected', 'info');
                    return false;
                }
            }
        }
    });

    // Detect and prevent drag-and-drop of images
    document.addEventListener('dragstart', function(e) {
        if (e.target.tagName === 'IMG' || e.target.classList.contains('content-protected')) {
            e.preventDefault();
            return false;
        }
    });

    // Dynamic watermark generation
    function updateWatermark() {
        if (window.currentUser) {
            const watermarkEl = document.getElementById('watermark-overlay');
            if (watermarkEl) {
                const timestamp = new Date().toISOString().split('T')[0];
                watermarkEl.textContent = `${window.currentUser.full_name} - ${timestamp}`;
            }
        }
    }

    // Update watermark every minute
    setInterval(updateWatermark, 60000);
    updateWatermark();

    // Monitor DevTools
    let devToolsOpen = false;
    const threshold = 160;

    const checkDevTools = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
            if (!devToolsOpen) {
                devToolsOpen = true;
                console.log('%cContent Protection Active', 'color: red; font-size: 20px; font-weight: bold;');
                console.log('%cThis content is protected by NexusHub Content Shield', 'color: orange; font-size: 14px;');
                console.log('%cUnauthorized copying or distribution is prohibited', 'color: orange; font-size: 14px;');
            }
        } else {
            devToolsOpen = false;
        }
    };

    setInterval(checkDevTools, 1000);

    // Screenshot detection (basic)
    document.addEventListener('keyup', function(e) {
        // Print Screen
        if (e.keyCode === 44) {
            showNotification('Screenshot detected - Content is watermarked', 'info');
            logContentAccess('screenshot_attempt');
        }
    });

    // Log content access for anti-theft tracking
    window.logContentAccess = function(actionType) {
        if (window.currentUser && window.currentProject) {
            fetch('/api/marketplace/log-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    project_id: window.currentProject.id,
                    action_type: actionType
                })
            }).catch(err => console.error('Failed to log access:', err));
        }
    };

    // Blur detection - when user switches tabs/windows
    let blurCount = 0;
    window.addEventListener('blur', function() {
        blurCount++;
        if (blurCount > 5) {
            logContentAccess('suspicious_blur_activity');
        }
    });

    // Console warning
    console.log('%cSTOP!', 'color: red; font-size: 60px; font-weight: bold;');
    console.log('%cThis is a browser feature intended for developers.', 'color: orange; font-size: 16px;');
    console.log('%cIf someone told you to copy-paste something here, they are trying to steal your account.', 'color: orange; font-size: 16px;');
    console.log('%cAll content on this platform is protected by NexusHub Content Shield.', 'color: #6366f1; font-size: 14px;');

})();
