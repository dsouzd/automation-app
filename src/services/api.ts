import axios from 'axios';

export interface ScriptResponse {
  success: boolean;
  script: Array<{
    action: string;
    selector: string;
    value?: string;
  }>;
}

export interface SummaryResponse {
  success: boolean;
  summary: {
    totalSteps: number;
    successCount: number;
    failedCount: number;
    executionTime: number;
  };
}

export const convertPromptToScriptAPI = async (prompt: string): Promise<ScriptResponse> => {
  // Mock API call with hardcoded response
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
  
  const lowerPrompt = prompt.toLowerCase();
  const script = [];
  
  // Parse the prompt to generate appropriate actions
  if (lowerPrompt.includes('click on login') || lowerPrompt.includes('login navigation')) {
    script.push({ action: 'click', selector: 'a[href*="login"], #login, .login, button:contains("Login"), a:contains("Login")' });
  }
  
  // Extract username
  const usernameMatch = prompt.match(/username[=:]\s*([^,\s]+)/i);
  if (usernameMatch) {
    script.push({ 
      action: 'type', 
      selector: 'input[name="username"], input[name="email"], input[type="email"], #username, #email, .username, .email', 
      value: usernameMatch[1] 
    });
  }
  
  // Extract password
  const passwordMatch = prompt.match(/password[=:]\s*([^,\s]+)/i);
  if (passwordMatch) {
    script.push({ 
      action: 'type', 
      selector: 'input[name="password"], input[type="password"], #password, .password', 
      value: passwordMatch[1] 
    });
  }
  
  // Click login button
  if (lowerPrompt.includes('click login') || lowerPrompt.includes('submit')) {
    script.push({ 
      action: 'click', 
      selector: 'button[type="submit"], input[type="submit"], button:contains("Login"), button:contains("Sign in"), .login-btn, #login-btn' 
    });
  }
  
  return {
    success: true,
    script: script.length > 0 ? script : [
      { action: 'click', selector: 'a[href*="login"]' },
      { action: 'type', selector: 'input[type="email"]', value: 'test@gmail.com' },
      { action: 'type', selector: 'input[type="password"]', value: 'test' },
      { action: 'click', selector: 'button[type="submit"]' }
    ]
  };
};

export const getSummaryAPI = async (logs: any[]): Promise<SummaryResponse> => {
  // Mock API call with hardcoded response
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  
  const successCount = logs.filter(log => log.result === 'success').length;
  const failedCount = logs.filter(log => log.result === 'failed').length;
  
  return {
    success: true,
    summary: {
      totalSteps: logs.length,
      successCount,
      failedCount,
      executionTime: logs.length * 1.2 // Mock execution time
    }
  };
};