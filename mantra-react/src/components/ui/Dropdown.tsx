import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
}

export function Dropdown({ options, value, onChange }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-background-secondary border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-card transition-colors"
            >
                {value}
                <ChevronDown className="w-3.5 h-3.5 text-foreground-secondary" />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-1 left-0 min-w-[140px] bg-card border border-border rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                    {options.map((option) => (
                        <button
                            key={option}
                            onClick={() => {
                                onChange(option);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-background-secondary transition-colors ${option === value
                                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30'
                                    : 'text-foreground'
                                }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
