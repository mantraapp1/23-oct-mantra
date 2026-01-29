import { useNavigate, useLocation } from 'react-router-dom';

export function useAppNavigation() {
    const navigate = useNavigate();
    const location = useLocation();

    const goBack = (fallbackPath: string = '/') => {
        // basic check if we have history to go back to
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate(fallbackPath, { replace: true });
        }
    };

    return { goBack, navigate, location };
}
