export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    // Track current dark mode state to avoid unnecessary DOM operations
    let darkModeEnabled = false;
    let isPageAlreadyDark = false;
    
    // Function to check if page already has dark mode
    const isDarkModeAlreadyEnabled = () => {
      // Cache document.body and documentElement to reduce property lookups
      const body = document.body;
      const html = document.documentElement;
      
      // If document body isn't ready yet, return false
      if (!body) return false;
      
      // Use getComputedStyle only when needed (expensive operation)
      const bodyBgColor = window.getComputedStyle(body).backgroundColor;
      const htmlBgColor = window.getComputedStyle(html).backgroundColor;
      
      // Function to efficiently calculate if a color is dark
      const isColorDark = (color: string): boolean => {
        // Handle transparent or undefined colors
        if (!color || color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
          return false;
        }
        
        // Extract RGB values once with a more efficient method
        const rgb = color.match(/\d+/g);
        if (!rgb || rgb.length < 3) return false;
        
        // Calculate luminance with faster number conversion
        const r = +rgb[0];
        const g = +rgb[1];
        const b = +rgb[2];
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
        
        // If luminance is less than 128 (out of 255), consider it dark
        return luminance < 128;
      };
      
      // Check if either body or html has a dark background
      return isColorDark(bodyBgColor) || isColorDark(htmlBgColor);
    };
    
    // Create style element once and reuse it
    let styleEl: HTMLStyleElement | null = null;
    
    // Function to apply dark mode CSS
    const applyDarkMode = () => {
      // Skip if already in dark mode
      if (darkModeEnabled) return;
      
      // Check if we need to re-evaluate if page has its own dark mode
      if (!isPageAlreadyDark) {
        isPageAlreadyDark = isDarkModeAlreadyEnabled();
      }
      
      // Don't apply if the site already has dark mode
      if (isPageAlreadyDark) {
        return;
      }
      
      // Set dark mode flag
      darkModeEnabled = true;
      
      // Set document color scheme
      document.documentElement.style.colorScheme = 'dark';
      
      // Create a style element if it doesn't exist
      if (!styleEl) {
        styleEl = document.getElementById('auto-dark-mode-style') as HTMLStyleElement;
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = 'auto-dark-mode-style';
          document.head.appendChild(styleEl);
        }
      }
      
      // Apply dark mode CSS
      styleEl.textContent = `
        html {
          filter: invert(90%) hue-rotate(180deg);
          background: #fff;
        }
        
        img, video, picture, svg, canvas {
          filter: invert(100%) hue-rotate(180deg);
        }
        
        /* Ensure text is visible in plain text files and code blocks */
        pre, code, plaintext, .blob-code-inner, .text-mono {
          color: #333 !important;
          filter: invert(100%) hue-rotate(180deg);
        }
      `;
    };
    
    // Function to remove dark mode
    const removeDarkMode = () => {
      // Skip if already in light mode
      if (!darkModeEnabled) return;
      
      // Set light mode flag
      darkModeEnabled = false;
      
      document.documentElement.style.colorScheme = 'light';
      
      // Remove style element content instead of removing the element
      if (styleEl) {
        styleEl.textContent = '';
      }
    };
    
    // Debounce function to limit expensive operations
    const debounce = (func: Function, wait: number) => {
      let timeout: number | undefined;
      return function executedFunction(...args: any[]) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait) as unknown as number;
      };
    };
    
    // Create debounced versions of our functions
    const debouncedApplyDarkMode = debounce(applyDarkMode, 100);
    const debouncedRemoveDarkMode = debounce(removeDarkMode, 100);
    
    // Detect system color scheme preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Define more efficient handler that we can add/remove as needed
    const handlePrefChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        debouncedApplyDarkMode();
      } else {
        debouncedRemoveDarkMode();
      }
    };
    
    // Initial check using requestIdleCallback for better performance
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        if (prefersDark.matches) {
          applyDarkMode();
        }
      });
    } else {
      // Fallback for browsers not supporting requestIdleCallback
      if (prefersDark.matches) {
        applyDarkMode();
      }
    }
    
    // Use a more efficient event listener approach
    prefersDark.addEventListener('change', handlePrefChange);
    
    // Listen for document changes that might indicate theme changes
    // Use a MutationObserver with a debounce to check for theme changes
    const observer = new MutationObserver(debounce(() => {
      if (prefersDark.matches && !isPageAlreadyDark) {
        isPageAlreadyDark = isDarkModeAlreadyEnabled();
        if (isPageAlreadyDark && darkModeEnabled) {
          removeDarkMode();
        } else if (!isPageAlreadyDark && !darkModeEnabled && prefersDark.matches) {
          applyDarkMode();
        }
      }
    }, 500));
    
    // Start observing with a configuration that minimizes overhead
    if (document.body) {
      observer.observe(document.body, { 
        attributes: true,
        attributeFilter: ['class', 'style'],
        childList: false,
        subtree: false
      });
    }
    
    // Clean up function
    return () => {
      observer.disconnect();
      prefersDark.removeEventListener('change', handlePrefChange);
      if (styleEl) {
        styleEl.remove();
      }
    };
  },
});
