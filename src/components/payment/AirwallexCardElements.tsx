"use client";
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";

interface AirwallexCardElementsProps {
  customerId?: string;
  clientSecret?: string;
  onReady?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export interface AirwallexCardElementsRef {
  createPaymentMethod: (clientSecret: string) => Promise<unknown>;
  isReady: () => boolean;
}

const AirwallexCardElements = forwardRef<AirwallexCardElementsRef, AirwallexCardElementsProps>(function AirwallexCardElements({
  customerId,
  clientSecret,
  onReady,
  onError,
  disabled = false
}, ref) {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent React from interfering with Airwallex elements
  const cardNumberRef = useRef<HTMLDivElement>(null);
  const cardExpiryRef = useRef<HTMLDivElement>(null);
  const cardCvcRef = useRef<HTMLDivElement>(null);

  // Refs to track mounting state and prevent multiple mounts
  const isInitialized = useRef(false);
  const isMounted = useRef(false);
  const mountedElements = useRef<any[]>([]);
  const airwallexSDK = useRef<any>(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    createPaymentMethod: async (clientSecret: string) => {
      if (!airwallexSDK.current) {
        throw new Error('Airwallex SDK not initialized');
      }
      
      try {
        // Use the Airwallex global object to create a payment method
        if (typeof window === 'undefined' || !(window as any).Airwallex) {
          throw new Error('Airwallex SDK not available in window object');
        }

        const { Airwallex } = window as unknown as { Airwallex: any };
        
        // Debug: Log available methods
        console.log('Available Airwallex methods:', Object.keys(Airwallex as object));
        console.log('Airwallex object:', Airwallex);
        console.log('Mounted elements:', mountedElements.current);
        
        // Check if elements are properly mounted
        if (mountedElements.current.length === 0) {
          throw new Error('No Airwallex elements are mounted. Please ensure the form is loaded.');
        }
        
        // Simple test to see what methods are available
        console.log('Testing available methods:');
        console.log('- Airwallex.confirmPayment:', typeof (Airwallex as any).confirmPayment);
        console.log('- Airwallex.createPaymentMethod:', typeof (Airwallex as any).createPaymentMethod);
        console.log('- Airwallex.createPaymentConsent:', typeof (Airwallex as any).createPaymentConsent);
        console.log('- Airwallex.createConsent:', typeof (Airwallex as any).createConsent);
        
        const cardNumberElement = mountedElements.current[0] as any;
        console.log('- cardNumberElement.confirmPayment:', typeof cardNumberElement?.confirmPayment);
        console.log('- cardNumberElement.createPaymentMethod:', typeof cardNumberElement?.createPaymentMethod);
        
        // Try different approaches to create payment method
        
        // Approach 1: Try using confirmPayment on the card number element (primary approach)
        // This will create and attach the payment method to the payment intent
        console.log('Card number element:', cardNumberElement);
        console.log('Card number element methods:', Object.keys(cardNumberElement || {}));
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Payment method creation timed out after 30 seconds')), 30000);
        });
        
        const createMethodPromise = (async () => {
          if (cardNumberElement && typeof cardNumberElement.confirmPayment === 'function') {
            console.log('Using element.confirmPayment to create payment method');
            return await cardNumberElement.confirmPayment({
              client_secret: clientSecret,
            });
          }
          // Approach 2: Try using the global confirmPayment method
          else if ((Airwallex as any).confirmPayment) {
            console.log('Using Airwallex.confirmPayment');
            return await (Airwallex as any).confirmPayment({
              client_secret: clientSecret,
            });
          }
          // Approach 3: Try createPaymentMethod on the element
          else if (cardNumberElement && typeof cardNumberElement.createPaymentMethod === 'function') {
            console.log('Using element.createPaymentMethod to create payment method');
            return await cardNumberElement.createPaymentMethod({
              client_secret: clientSecret,
            });
          }
          // Approach 4: Try createPaymentMethod on global object
          else if ((Airwallex as any).createPaymentMethod) {
            console.log('Using Airwallex.createPaymentMethod');
            return await (Airwallex as any).createPaymentMethod({
              client_secret: clientSecret,
            });
          }
          // Approach 5: Try createPaymentConsent on global object (fallback)
          else if ((Airwallex as any).createPaymentConsent) {
            console.log('Using Airwallex.createPaymentConsent as fallback');
            return await (Airwallex as any).createPaymentConsent({
              client_secret: clientSecret,
            });
          }
          // Approach 6: Try alternative method names
          else if ((Airwallex as any).createConsent) {
            console.log('Using Airwallex.createConsent as fallback');
            return await (Airwallex as any).createConsent({
              client_secret: clientSecret,
            });
          }
          else {
            console.error('No payment method creation method found');
            console.log('Available methods on Airwallex:', Object.keys(Airwallex as object));
            console.log('Available methods on card element:', Object.keys(cardNumberElement || {}));
            throw new Error('No payment method creation method available. Please check Airwallex SDK documentation.');
          }
        })();
        
        // Race between the actual operation and the timeout
        const paymentMethod = await Promise.race([createMethodPromise, timeoutPromise]);
        
        console.log('Payment method result:', paymentMethod);
        
        if (!paymentMethod) {
          throw new Error('Payment method creation returned null or undefined');
        }

        return paymentMethod;
      } catch (error) {
        console.error('Failed to create payment method:', error);
        throw error;
      }
    },
    isReady: () => {
      const ready = sdkLoaded && isMounted.current;
      console.log('AirwallexCardElements isReady check:', {
        sdkLoaded,
        isMounted: isMounted.current,
        mountedElementsCount: mountedElements.current.length,
        ready
      });
      return ready;
    }
  }), [sdkLoaded]);

  // Single useEffect to handle everything - Airwallex setup, error boundary, and cleanup
  useEffect(() => {
    // More comprehensive error boundary setup
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('removeChild')) {
        console.warn('React DOM conflict detected, ignoring:', event.error.message);
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('removeChild')) {
        console.warn('React DOM conflict detected in promise, ignoring:', event.reason.message);
        event.preventDefault();
        return false;
      }
    };

    // Override the native removeChild method to prevent errors
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function<T extends Node>(child: T): T {
      try {
        return originalRemoveChild.call(this, child) as T;
      } catch (error) {
        if (error instanceof Error && error.message.includes('removeChild')) {
          console.warn('Prevented removeChild error:', error.message);
          return child; // Return the child to prevent the error
        }
        throw error; // Re-throw other errors
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Airwallex setup function
    const setupAirwallex = async () => {
      // Prevent multiple initializations
      if (isInitialized.current || sdkLoaded || disabled) {
        return;
      }

      try {
        isInitialized.current = true;
        
        // Step 1: Load Airwallex SDK if not already loaded
        await loadAirwallexSDK();
        
        // Step 2: Initialize Airwallex
        await initializeAirwallex();
        
        setSdkLoaded(true);
        onReady?.();
      } catch (error) {
        console.error('Failed to setup Airwallex in component:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        onError?.(errorMessage);
        // Reset initialization flag on error so we can retry
        isInitialized.current = false;
      }
    };

    // Start Airwallex setup
    setupAirwallex();

    // Cleanup function to handle both error boundary and Airwallex cleanup
    return () => {
      // Remove error event listeners
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      
      // Restore original removeChild method
      Node.prototype.removeChild = originalRemoveChild;
      
      // Clean up mounted elements using their destroy methods
      if (mountedElements.current.length > 0) {
        mountedElements.current.forEach(element => {
          try {
            if (element && typeof element.destroy === 'function') {
              element.destroy();
            }
          } catch (destroyError) {
            console.warn('Error destroying element:', destroyError);
          }
        });
        mountedElements.current = [];
      }
      
      // Reset mounting flags
      isMounted.current = false;
      isInitialized.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once (component mount/unmount lifecycle)

  const loadAirwallexSDK = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Not in browser environment'));
        return;
      }

      if ((window as any).Airwallex) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.airwallex.com/assets/elements.bundle.min.js';
      script.async = true;
      script.onload = () => {
        resolve();
      };
      script.onerror = (error) => {
        console.error('Failed to load Airwallex SDK from CDN:', error);
        reject(new Error('Failed to load Airwallex SDK'));
      };
      document.head.appendChild(script);
    });
  };

  const initializeAirwallex = async () => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.error('Not in browser environment');
        return;
      }

      // Check if already mounted
      if (isMounted.current) {
        return;
      }

      // Try both module import and global object
      let init, createElement;
      
      try {
        const airwallexModule = await import('@airwallex/components-sdk');
        init = airwallexModule.init;
        createElement = airwallexModule.createElement;
      } catch {
        // Try global Airwallex object
        if (typeof window !== 'undefined' && (window as any).Airwallex) {
          const globalAirwallex = (window as any).Airwallex;
          init = globalAirwallex.init;
          createElement = globalAirwallex.createElement;
        } else {
          throw new Error('Airwallex SDK not available');
        }
      }

      if (!init || !createElement) {
        throw new Error('Airwallex SDK methods not found');
      }

      // Store SDK reference for later use
      airwallexSDK.current = {
        init,
        createElement
      };

      const options: any = {
        locale: 'en' as const,
        env: 'demo' as const,
        enabledElements: ['payments'], // Correct for payment elements
        origin: window.location.origin,
      };

      // For registered customer flows, try different approaches
      if (customerId) {
        // Try with customer context
        options.customer = {
          id: customerId,
        };
        
        // Add client secret if available
        if (clientSecret) {
          options.client_secret = clientSecret;
        }
      }

      // If we have a client secret, add it to the options
      if (clientSecret) {
        options.client_secret = clientSecret;
      }

      let initSuccess = false;
      try {
        await init(options);
        initSuccess = true;
      } catch {
        // Try fallback to guest flow
        const guestOptions = {
          locale: 'en' as const,
          env: 'demo' as const,
          enabledElements: ['payments'], // Correct for payment elements
          origin: window.location.origin,
        };
        
        try {
          await init(guestOptions);
          initSuccess = true;
        } catch {
          throw new Error('Failed to initialize Airwallex with both registered customer and guest flows');
        }
      }
      
      if (!initSuccess) {
        throw new Error('Airwallex initialization failed');
      }

      // Step 3: Create and Mount the Split Card Elements
      const cardNumberElement = await createElement('cardNumber');
      const cardExpiryElement = await createElement('expiry');
      const cardCvcElement = await createElement('cvc');

      // Check if mount elements exist
      const cardNumberContainer = document.getElementById('card-number-element');
      const cardExpiryContainer = document.getElementById('card-expiry-element');
      const cardCvcContainer = document.getElementById('card-cvc-element');

      if (!cardNumberContainer || !cardExpiryContainer || !cardCvcContainer) {
        throw new Error('Mount containers not found in DOM');
      }

      // Check if elements are already mounted
      if (isMounted.current) {
        return;
      }

      // Mount all elements at once
      try {
        // Mount elements one by one to ensure proper mounting
        await cardNumberElement.mount('#card-number-element');
        await cardExpiryElement.mount('#card-expiry-element');
        await cardCvcElement.mount('#card-cvc-element');
        
        // Store mounted elements for cleanup
        mountedElements.current = [cardNumberElement, cardExpiryElement, cardCvcElement];
        
        // Mark as mounted
        isMounted.current = true;
        
        // Wait a bit for iframes to be created
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Quick check if iframes were created - if yes, we're done!
        const cardNumberContainer = document.getElementById('card-number-element');
        const cardExpiryContainer = document.getElementById('card-expiry-element');
        const cardCvcContainer = document.getElementById('card-cvc-element');
        
        const cardNumberIframes = cardNumberContainer?.querySelectorAll('iframe');
        const cardExpiryIframes = cardExpiryContainer?.querySelectorAll('iframe');
        const cardCvcIframes = cardCvcContainer?.querySelectorAll('iframe');
        
        const totalIframes = (cardNumberIframes?.length || 0) + (cardExpiryIframes?.length || 0) + (cardCvcIframes?.length || 0);
        
        // If we have iframes, we're successful - stop here!
        if (totalIframes > 0) {
          console.log('✅ Airwallex Elements mounted successfully with', totalIframes, 'iframes');
          return; // Exit early - no more processing needed
        }
        
        // Only try alternative mounting if no iframes were created
        try {
          // Try mounting with different selectors
          await cardNumberElement.mount('card-number-element');
          await cardExpiryElement.mount('card-expiry-element');
          await cardCvcElement.mount('card-cvc-element');
          
          // Wait again
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Final check
          const finalCardNumberIframes = cardNumberContainer?.querySelectorAll('iframe');
          const finalCardExpiryIframes = cardExpiryContainer?.querySelectorAll('iframe');
          const finalCardCvcIframes = cardCvcContainer?.querySelectorAll('iframe');
          
          const finalTotalIframes = (finalCardNumberIframes?.length || 0) + (finalCardExpiryIframes?.length || 0) + (finalCardCvcIframes?.length || 0);
          
          if (finalTotalIframes > 0) {
            console.log('✅ Airwallex Elements mounted successfully with alternative method');
          } else {
            console.warn('⚠️ No iframes found after alternative mounting - elements may not be interactive');
          }
        } catch (alternativeError) {
          console.error('Alternative mounting failed:', alternativeError);
          console.warn('⚠️ Elements mounted but iframes may not be interactive');
        }
        
      } catch (err) {
        console.error('Failed to mount card elements:', err);
        // Reset mounting flag on error
        isMounted.current = false;
        throw err;
      }

    } catch (error) {
      console.error('Failed to initialize Airwallex in component:', error);
      throw error;
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400">Payment form error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Card Number Element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Card Number *
        </label>
        <div 
          ref={cardNumberRef}
          id="card-number-element" 
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 h-10 relative"
          style={{ 
            position: 'relative',
            zIndex: 1,
            pointerEvents: 'auto',
            height: '40px',
            minHeight: '40px',
            maxHeight: '40px'
          }}
          suppressHydrationWarning
        >
          {!sdkLoaded && (
            <div className="flex items-center justify-center h-10">
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Enter your card number
        </p>
      </div>

      {/* Card Expiry and CVC Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Expiry Date *
          </label>
          <div 
            ref={cardExpiryRef}
            id="card-expiry-element" 
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 h-10 relative"
            style={{ 
              position: 'relative',
              zIndex: 1,
              pointerEvents: 'auto',
              height: '40px',
              minHeight: '40px',
              maxHeight: '40px'
            }}
            suppressHydrationWarning
          >
            {!sdkLoaded && (
              <div className="flex items-center justify-center h-10">
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            MM/YY
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            CVC *
          </label>
          <div 
            ref={cardCvcRef}
            id="card-cvc-element" 
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 h-10 relative"
            style={{ 
              position: 'relative',
              zIndex: 1,
              pointerEvents: 'auto',
              height: '40px',
              minHeight: '40px',
              maxHeight: '40px'
            }}
            suppressHydrationWarning
          >
            {!sdkLoaded && (
              <div className="flex items-center justify-center h-10">
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Security code
          </p>
        </div>
      </div>
    </div>
  );
});

export default AirwallexCardElements; 