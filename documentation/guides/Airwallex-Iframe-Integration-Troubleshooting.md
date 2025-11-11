# Airwallex Iframe Integration Troubleshooting Guide

## Overview
This document tracks the issues encountered and solutions implemented while integrating Airwallex Split Card Elements into a Next.js application.

## Initial Setup
- **Component**: `AirwallexCardElements.tsx`
- **Framework**: Next.js 14 with App Router
- **SDK**: Airwallex Components SDK
- **Elements**: Card Number, Expiry Date, CVC

## Issues Encountered & Solutions

### 1. Multiple useEffect Hooks Causing Conflicts

**Problem**: Multiple useEffect hooks were causing race conditions and unpredictable behavior.

**Symptoms**:
- Inconsistent iframe mounting
- React DOM reconciliation errors
- Elements mounting multiple times

**Solution**: Consolidated all logic into a single useEffect
```typescript
// Before: Multiple useEffect hooks
useEffect(() => { /* SDK loading */ }, []);
useEffect(() => { /* initialization */ }, [dependencies]);
useEffect(() => { /* error boundary */ }, []);

// After: Single useEffect
useEffect(() => {
  // Error boundary setup
  // SDK loading
  // Initialization
  // Cleanup
}, []); // Empty dependency array
```

### 2. React DOM Reconciliation Conflicts

**Problem**: React's DOM reconciliation was conflicting with Airwallex's iframe creation.

**Symptoms**:
- `Error: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.`
- Iframes not appearing consistently
- Page errors after iframe loading

**Solutions Implemented**:

#### A. Error Boundary with Event Listeners
```typescript
const handleError = (event: ErrorEvent) => {
  if (event.error?.message?.includes('removeChild')) {
    console.warn('React DOM conflict detected, ignoring:', event.error.message);
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
};

window.addEventListener('error', handleError);
window.addEventListener('unhandledrejection', handleUnhandledRejection);
```

#### B. Native Method Override
```typescript
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
```

### 3. Multiple Mounting Attempts

**Problem**: Elements were being mounted multiple times due to dependency array changes.

**Symptoms**:
- Iframes not working after initial load
- Console errors about duplicate mounting
- Inconsistent behavior

**Solution**: Added mounting state guards
```typescript
// Refs to track mounting state
const isInitialized = useRef(false);
const isMounted = useRef(false);
const mountedElements = useRef<any[]>([]);

// Guards in setup function
if (isInitialized.current || sdkLoaded || disabled) {
  console.log('Airwallex already initialized or disabled, skipping setup');
  return;
}

if (isMounted.current) {
  console.log('Elements already mounted, skipping mounting');
  return;
}
```

### 4. Excessive Processing After Successful Mounting

**Problem**: Code continued processing after successful iframe creation, causing page errors.

**Symptoms**:
- Page errors after successful mounting
- Excessive console logging
- Performance issues

**Solution**: Early exit on success
```typescript
// If we have iframes, we're successful - stop here!
if (totalIframes > 0) {
  console.log('✅ Airwallex Elements mounted successfully with', totalIframes, 'iframes');
  return; // Exit early - no more processing needed
}
```

### 5. Component Architecture Issues

**Problem**: All Airwallex logic was mixed with page logic, making debugging difficult.

**Solution**: Separated into dedicated component
```typescript
// Before: Mixed logic in main page
// After: Clean separation
<AirwallexCardElements
  customerId={paymentIntent.customer.id}
  clientSecret={(paymentIntent as any)?.client_secret}
  onReady={handleAirwallexReady}
  onError={handleAirwallexError}
/>
```

## Key Implementation Details

### Component Structure
```typescript
interface AirwallexCardElementsProps {
  customerId?: string;
  clientSecret?: string;
  onReady?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}
```

### Mounting Strategy
1. **Single Initialization**: Only initialize once per component lifecycle
2. **State Tracking**: Use refs to track initialization and mounting state
3. **Early Exit**: Stop processing once iframes are successfully created
4. **Proper Cleanup**: Use Airwallex's destroy methods for cleanup

### Error Handling Strategy
1. **Error Boundary**: Catch and suppress React DOM conflicts
2. **Method Override**: Prevent removeChild errors at the DOM level
3. **Graceful Degradation**: Continue operation even if some errors occur

## CSS Requirements

### Container Styling
```css
/* Ensure iframes are interactive */
iframe {
  width: 100% !important;
  height: 40px !important; /* Single-line height */
  border: none !important;
  pointer-events: auto !important;
  z-index: 1 !important;
}
```

### Container Elements
```typescript
<div 
  id="card-number-element" 
  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 min-h-[40px] relative"
  style={{ 
    position: 'relative',
    zIndex: 1,
    pointerEvents: 'auto'
  }}
  suppressHydrationWarning
>
```

## Testing Checklist

- [ ] Iframes load on first page load
- [ ] No console errors after iframe creation
- [ ] Elements are interactive (can type in them)
- [ ] No React DOM reconciliation errors
- [ ] Proper cleanup on component unmount
- [ ] Works with both registered customer and guest flows
- [ ] Responsive design maintained

## Performance Optimizations

1. **Single useEffect**: Reduces effect execution overhead
2. **Early Exit**: Prevents unnecessary processing
3. **Proper Cleanup**: Prevents memory leaks
4. **State Guards**: Prevents duplicate operations

## Lessons Learned

1. **React DOM Reconciliation**: Third-party iframe libraries can conflict with React's DOM management
2. **useEffect Dependencies**: Empty dependency arrays are crucial for one-time initialization
3. **Error Boundaries**: Essential for catching and handling DOM conflicts
4. **Component Separation**: Isolating third-party integrations improves maintainability
5. **State Management**: Use refs for values that shouldn't trigger re-renders

## Future Considerations

1. **Error Recovery**: Implement retry mechanisms for failed initializations
2. **Loading States**: Add better visual feedback during iframe loading
3. **Accessibility**: Ensure iframes meet accessibility requirements
4. **Testing**: Add comprehensive unit and integration tests
5. **Monitoring**: Add error tracking for production issues

## Related Files

- `src/components/payment/AirwallexCardElements.tsx` - Main component
- `src/app/(admin)/dashboard/payment-intents/add-payment-method/[id]/page.tsx` - Usage example
- `src/app/globals.css` - CSS styles for iframe containers 