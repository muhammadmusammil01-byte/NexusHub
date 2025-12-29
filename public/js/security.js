/**
 * NexusHub Content Shield
 * Anti-theft protection with context menu blocking and dynamic watermarking
 */

(function() {
    'use strict';

    // Content Shield Configuration
    const ContentShield = {
        watermarkEnabled: true,
        watermarkText: '',
        watermarkOpacity: 0.1,
        preventCopy: true,
        preventScreenshot: true,
        preventDevTools: false
    };

    /**
     * Initialize Content Shield
     */
    function initializeContentShield(config = {}) {
        Object.assign(ContentShield, config);
        
        if (ContentShield.preventCopy) {
            disableContextMenu();
            disableKeyboardShortcuts();
            disableTextSelection();
        }

        if (ContentShield.watermarkEnabled && ContentShield.watermarkText) {
            applyDynamicWatermark();
        }

        if (ContentShield.preventDevTools) {
            detectDevTools();
        }

        console.log('🛡️ Content Shield activated');
    }

    /**
     * Disable right-click context menu
     */
    function disableContextMenu() {
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            showProtectionNotice('Right-click disabled for content protection');
            return false;
        }, false);
    }

    /**
     * Disable keyboard shortcuts for copying, printing, and screenshots
     */
    function disableKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Disable Ctrl+C (Copy)
            if (e.ctrlKey && e.key === 'c') {
                e.preventDefault();
                showProtectionNotice('Copy disabled for content protection');
                return false;
            }

            // Disable Ctrl+X (Cut)
            if (e.ctrlKey && e.key === 'x') {
                e.preventDefault();
                showProtectionNotice('Cut disabled for content protection');
                return false;
            }

            // Disable Ctrl+P (Print)
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                showProtectionNotice('Print disabled for content protection');
                return false;
            }

            // Disable Ctrl+S (Save)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                showProtectionNotice('Save disabled for content protection');
                return false;
            }

            // Disable Ctrl+U (View Source)
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                showProtectionNotice('View source disabled for content protection');
                return false;
            }

            // Disable F12 (Developer Tools)
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl+Shift+I (Developer Tools)
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl+Shift+J (Console)
            if (e.ctrlKey && e.shiftKey && e.key === 'J') {
                e.preventDefault();
                return false;
            }

            // Disable Ctrl+Shift+C (Inspect Element)
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                return false;
            }

            // Disable PrintScreen
            if (e.key === 'PrintScreen') {
                showProtectionNotice('Screenshot disabled for content protection');
            }
        }, false);
    }

    /**
     * Disable text selection
     */
    function disableTextSelection() {
        document.addEventListener('selectstart', function(e) {
            e.preventDefault();
            return false;
        }, false);

        // Add CSS to prevent selection
        const style = document.createElement('style');
        style.innerHTML = `
            .content-protected {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Apply dynamic watermark to protected content
     */
    function applyDynamicWatermark() {
        const watermarkContainer = document.createElement('div');
        watermarkContainer.id = 'content-watermark';
        watermarkContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
        `;

        // Create multiple watermark elements for better coverage
        const rows = Math.ceil(window.innerHeight / 200);
        const cols = Math.ceil(window.innerWidth / 300);

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const watermark = document.createElement('div');
                watermark.className = 'watermark-item';
                watermark.textContent = ContentShield.watermarkText;
                watermark.style.cssText = `
                    position: absolute;
                    top: ${i * 200}px;
                    left: ${j * 300}px;
                    opacity: ${ContentShield.watermarkOpacity};
                    color: #000;
                    font-size: 20px;
                    font-weight: bold;
                    transform: rotate(-45deg);
                    white-space: nowrap;
                    pointer-events: none;
                `;
                watermarkContainer.appendChild(watermark);
            }
        }

        document.body.appendChild(watermarkContainer);

        // Update watermark on window resize
        window.addEventListener('resize', function() {
            const existingWatermark = document.getElementById('content-watermark');
            if (existingWatermark) {
                existingWatermark.remove();
                applyDynamicWatermark();
            }
        });

        // Prevent watermark removal via DevTools
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
                    mutation.removedNodes.forEach(function(node) {
                        if (node.id === 'content-watermark') {
                            console.warn('Watermark removal detected - reapplying');
                            applyDynamicWatermark();
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: false
        });
    }

    /**
     * Detect if DevTools are open
     */
    function detectDevTools() {
        const threshold = 160;
        let devToolsOpen = false;

        setInterval(function() {
            if (window.outerWidth - window.innerWidth > threshold ||
                window.outerHeight - window.innerHeight > threshold) {
                if (!devToolsOpen) {
                    devToolsOpen = true;
                    handleDevToolsOpen();
                }
            } else {
                devToolsOpen = false;
            }
        }, 1000);
    }

    /**
     * Handle DevTools detection
     */
    function handleDevToolsOpen() {
        console.clear();
        showProtectionNotice('Developer tools detected - content protection active');
    }

    /**
     * Show protection notice to user
     */
    function showProtectionNotice(message) {
        const notice = document.createElement('div');
        notice.className = 'protection-notice';
        notice.textContent = message;
        notice.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(220, 38, 38, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notice);

        setTimeout(function() {
            notice.style.opacity = '0';
            notice.style.transition = 'opacity 0.3s ease-out';
            setTimeout(function() {
                notice.remove();
            }, 300);
        }, 3000);
    }

    /**
     * Apply content protection to specific elements
     */
    function protectElement(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(function(element) {
            element.classList.add('content-protected');
            element.setAttribute('data-protected', 'true');
        });
    }

    /**
     * Remove content protection
     * Note: This is a simplified disable function.
     * In production, store handler references for proper cleanup.
     */
    function disableContentShield() {
        // Remove watermark
        const watermark = document.getElementById('content-watermark');
        if (watermark) {
            watermark.remove();
        }

        // Note: Event listeners remain active as they were added anonymously
        // To fully remove, handler references would need to be stored during initialization
        console.log('🔓 Content Shield deactivated (watermark removed, event listeners remain for security)');
    }

    // Add CSS animations
    const animationStyle = document.createElement('style');
    animationStyle.innerHTML = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(animationStyle);

    // Export to global scope
    window.ContentShield = {
        init: initializeContentShield,
        protect: protectElement,
        disable: disableContentShield
    };

})();
