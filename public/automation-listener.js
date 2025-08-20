// Add this script to your localhost:4001 application
window.addEventListener('message', function(event) {
    if (event.data.type === 'AUTOMATION_ACTION') {
        const { action, selector, value } = event.data;
        
        // Try multiple selectors
        const selectors = selector.split(',').map(s => s.trim());
        let element = null;
        
        for (const sel of selectors) {
            try {
                element = document.querySelector(sel);
                if (element) break;
            } catch (e) {
                continue;
            }
        }
        
        if (element) {
            // Highlight element before action
            const originalStyle = element.style.cssText;
            element.style.cssText += 'border: 3px solid red !important; background-color: yellow !important;';
            
            setTimeout(() => {
                switch (action) {
                    case 'click':
                        element.click();
                        break;
                    case 'type':
                        if (element.tagName === 'INPUT' && value) {
                            element.focus();
                            element.value = value;
                            element.dispatchEvent(new Event('input', { bubbles: true }));
                            element.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        break;
                }
                
                // Remove highlight after action
                setTimeout(() => {
                    element.style.cssText = originalStyle;
                }, 1000);
            }, 500);
        }
    }
});