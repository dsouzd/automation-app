// Add this script to your localhost:4001 application
console.log('🎯 Automation script loaded');

window.addEventListener('message', function(event) {
    if (event.data.type === 'AUTOMATION_ACTION') {
        const { action, selector, value } = event.data;
        console.log('📥 Received automation:', action, selector, value);
        
        const selectors = selector.split(',').map(s => s.trim());
        let element = null;
        
        for (const sel of selectors) {
            try {
                element = document.querySelector(sel);
                if (element) break;
            } catch (e) { continue; }
        }
        
        if (element) {
            const originalStyle = element.style.cssText;
            element.style.cssText += 'border: 3px solid #f97316 !important; background-color: #fff7ed !important; box-shadow: 0 0 10px #f97316 !important; transition: all 0.3s !important;';
            
            setTimeout(() => {
                switch (action) {
                    case 'click':
                        element.click();
                        console.log('✅ Clicked:', element);
                        break;
                    case 'type':
                        if (element.tagName === 'INPUT' && value) {
                            element.focus();
                            element.value = value;
                            element.dispatchEvent(new Event('input', { bubbles: true }));
                            element.dispatchEvent(new Event('change', { bubbles: true }));
                            console.log('✅ Typed:', value);
                        }
                        break;
                }
                
                setTimeout(() => {
                    element.style.cssText = originalStyle;
                }, 1500);
            }, 800);
        } else {
            console.log('❌ Element not found:', selector);
        }
    }
});