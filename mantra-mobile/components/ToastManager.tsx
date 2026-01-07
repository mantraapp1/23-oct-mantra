import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast, { ToastConfig } from './Toast';

interface ToastContextType {
  showToast: (type: 'success' | 'error' | 'warning' | 'info' | 'loading', message: string, duration?: number) => string;
  showActionToast: (message: string, actionText: string, onAction: () => void) => string;
  showUndoToast: (message: string, onUndo: () => void) => string;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);
  const insets = useSafeAreaInsets();

  const showToast = (type: 'success' | 'error' | 'warning' | 'info' | 'loading', message: string, duration?: number): string => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    
    // Default durations: 3s for info/success, 5s for errors
    let defaultDuration = 3000;
    if (type === 'error') {
      defaultDuration = 5000;
    } else if (type === 'loading') {
      defaultDuration = 0; // Loading toasts don't auto-dismiss
    }
    
    const toast: ToastConfig = {
      id,
      type,
      message,
      duration: duration !== undefined ? duration : defaultDuration,
    };

    setToasts(prev => [...prev, toast]);
    return id;
  };

  const showActionToast = (message: string, actionText: string, onAction: () => void): string => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: ToastConfig = {
      id,
      type: 'info',
      message,
      actionText,
      onAction,
      duration: 5000,
    };

    setToasts(prev => [...prev, toast]);
    return id;
  };

  const showUndoToast = (message: string, onUndo: () => void): string => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: ToastConfig = {
      id,
      type: 'info',
      message,
      onUndo,
      duration: 4000,
    };

    setToasts(prev => [...prev, toast]);
    return id;
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const contextValue: ToastContextType = {
    showToast,
    showActionToast,
    showUndoToast,
    hideToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <View style={[styles.toastContainer, { top: insets.top + 8 }]}>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            config={toast}
            onClose={hideToast}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
});
