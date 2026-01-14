import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import CustomAlert, { AlertButton } from '../components/common/CustomAlert';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertContextType {
    showAlert: (type: AlertType, title: string, message: string, buttons?: AlertButton[]) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState<{
        type: AlertType;
        title: string;
        message: string;
        buttons: AlertButton[];
    }>({
        type: 'info',
        title: '',
        message: '',
        buttons: [],
    });

    const hideAlert = useCallback(() => {
        setVisible(false);
    }, []);

    const showAlert = useCallback((type: AlertType, title: string, message: string, buttons: AlertButton[] = []) => {
        // Wrap button onPress handlers to ensure they close the alert if not handled
        const wrappedButtons = buttons.length > 0 ? buttons.map(btn => ({
            ...btn,
            onPress: () => {
                if (btn.onPress) btn.onPress();
                hideAlert();
            }
        })) : [
            { text: 'OK', style: 'default' as const, onPress: () => hideAlert() }
        ];

        setConfig({
            type,
            title,
            message,
            buttons: wrappedButtons as AlertButton[]
        });
        setVisible(true);
    }, [hideAlert]);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <CustomAlert
                visible={visible}
                title={config.title}
                message={config.message}
                buttons={config.buttons}
                onDismiss={hideAlert}
            />
        </AlertContext.Provider>
    );
};

export const useCustomAlert = (): AlertContextType => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useCustomAlert must be used within an AlertProvider');
    }
    return context;
};

// Alias for consistency
export const useAlert = useCustomAlert;
