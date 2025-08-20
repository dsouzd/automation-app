import { LogEntry } from '../store/useStore';

export interface ScriptAction {
  action: 'click' | 'type' | 'submit';
  selector: string;
  value?: string;
}



export const executeScript = async (
  actions: any[],
  iframe: HTMLIFrameElement,
  onLog: (log: LogEntry) => void
): Promise<void> => {
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Delay for visibility
      
      // Try to access iframe document
      let iframeDoc: Document | null = null;
      try {
        iframeDoc = iframe.contentDocument || iframe.contentWindow?.document || null;
      } catch (e) {
        // Cross-origin restriction - inject script instead
        console.log('Cross-origin detected, using postMessage');
      }

      if (iframeDoc) {
        // Same-origin: direct DOM access
        const element = iframeDoc.querySelector(action.selector) as HTMLElement;
        if (!element) {
          onLog({
            step: i + 1,
            action: action.action,
            selector: action.selector,
            value: action.value,
            result: 'failed',
            timestamp: new Date()
          });
          continue;
        }

        switch (action.action) {
          case 'click':
            element.click();
            break;
          case 'type':
            if (element instanceof HTMLInputElement && action.value) {
              element.value = action.value;
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
            }
            break;
          case 'submit':
            if (element instanceof HTMLFormElement) {
              element.submit();
            }
            break;
        }

        onLog({
          step: i + 1,
          action: action.action,
          selector: action.selector,
          value: action.value,
          result: 'success',
          timestamp: new Date()
        });
      } else {
        // Cross-origin: use postMessage to communicate with iframe
        const message = {
          type: 'AUTOMATION_ACTION',
          action: action.action,
          selector: action.selector,
          value: action.value,
          step: i + 1
        };
        
        iframe.contentWindow?.postMessage(message, '*');
        
        // For demo purposes, assume success (in real app, wait for response)
        onLog({
          step: i + 1,
          action: action.action,
          selector: action.selector,
          value: action.value,
          result: 'success',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Action failed:', error);
      onLog({
        step: i + 1,
        action: action.action,
        selector: action.selector,
        value: action.value,
        result: 'failed',
        timestamp: new Date()
      });
    }
  }
};