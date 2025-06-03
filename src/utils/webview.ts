// Utility functions for detecting and handling webview environments

export function isInWebView(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  // Check for common webview indicators
  const webviewIndicators = [
    'line/', // LINE app
    'wechat', // WeChat
    'micromessenger', // WeChat alternative name
    'fbav', // Facebook app
    'fban', // Facebook app
    'instagram', // Instagram app
    'twitter', // Twitter app
    'snapchat', // Snapchat app
    'tiktok', // TikTok app
    'whatsapp', // WhatsApp app
    'telegram', // Telegram app
    'kakaotalk', // KakaoTalk app
    'viber', // Viber app
    'discord', // Discord app
  ];
  
  // Check if any webview indicators are present
  const isWebview = webviewIndicators.some(indicator => 
    userAgent.includes(indicator)
  );
  
  // Additional checks for embedded browsers
  const isEmbedded = (
    // Check if it's not a standalone browser
    !userAgent.includes('safari') && 
    !userAgent.includes('chrome') && 
    !userAgent.includes('firefox') && 
    !userAgent.includes('edge')
  ) || (
    // Check for webview-specific properties
    // @ts-ignore - checking for iOS standalone mode
    window.navigator.standalone === false ||
    // @ts-ignore - checking for webview-specific properties
    window.webkit?.messageHandlers ||
    // @ts-ignore
    window.AndroidInterface ||
    // @ts-ignore
    window.external?.notify
  );
  
  return isWebview || isEmbedded;
}

export function getWebViewType(): string | null {
  if (typeof window === 'undefined') return null;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('line/')) return 'LINE';
  if (userAgent.includes('wechat') || userAgent.includes('micromessenger')) return 'WeChat';
  if (userAgent.includes('fbav') || userAgent.includes('fban')) return 'Facebook';
  if (userAgent.includes('instagram')) return 'Instagram';
  if (userAgent.includes('twitter')) return 'Twitter';
  if (userAgent.includes('snapchat')) return 'Snapchat';
  if (userAgent.includes('tiktok')) return 'TikTok';
  if (userAgent.includes('whatsapp')) return 'WhatsApp';
  if (userAgent.includes('telegram')) return 'Telegram';
  if (userAgent.includes('kakaotalk')) return 'KakaoTalk';
  if (userAgent.includes('viber')) return 'Viber';
  if (userAgent.includes('discord')) return 'Discord';
  
  return 'Unknown App';
}

export function openInBrowser(url?: string): void {
  const targetUrl = url || window.location.href;
  
  // Try different methods to open in external browser
  try {
    // Method 1: Try to open in new window/tab
    const newWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    
    // Method 2: If that fails, try location assignment
    if (!newWindow) {
      window.location.assign(targetUrl);
    }
  } catch (error) {
    console.error('Failed to open in browser:', error);
    // Fallback: copy URL to clipboard and show instructions
    copyToClipboard(targetUrl);
  }
}

export function copyToClipboard(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => resolve(true)).catch(() => resolve(false));
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          textArea.remove();
          resolve(true);
        } catch (err) {
          textArea.remove();
          resolve(false);
        }
      }
    } catch (error) {
      resolve(false);
    }
  });
}

export function getWebViewInstructions(webviewType: string | null): string {
  const baseInstructions = "To sign in with Google, please open this page in your browser app";
  
  switch (webviewType) {
    case 'LINE':
      return `${baseInstructions}. In LINE, tap the menu (⋯) and select "Open in Browser".`;
    case 'WeChat':
      return `${baseInstructions}. In WeChat, tap the menu (⋯) and select "Open in Browser".`;
    case 'Facebook':
      return `${baseInstructions}. In Facebook, tap the menu and select "Open in Browser".`;
    case 'Instagram':
      return `${baseInstructions}. In Instagram, tap the menu (⋯) and select "Open in Browser".`;
    case 'Twitter':
      return `${baseInstructions}. In Twitter, tap the share button and select "Open in Browser".`;
    default:
      return `${baseInstructions}. Look for a menu option like "Open in Browser" or "Open in Safari/Chrome".`;
  }
} 