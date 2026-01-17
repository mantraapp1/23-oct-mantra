'use client';

import { useState, useRef, useEffect } from 'react';

interface DropdownProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
    fullWidth?: boolean;
    label?: string;
}

export function Dropdown({ options, value, onChange, className = '', fullWidth = false, label }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className={`relative ${fullWidth ? 'w-full' : ''} ${className}`}>
            {label && (
                <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
            )}
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center justify-between gap-2
                    ${fullWidth
                        ? 'w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl'
                        : 'px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-full shadow-sm'
                    }
                    font-semibold text-slate-700
                    hover:border-sky-300
                    transition-all
                    ${isOpen ? 'border-sky-400 ring-2 ring-sky-100' : ''}
                `}
            >
                <span>{value}</span>
                <svg
                    width={fullWidth ? "18" : "14"}
                    height={fullWidth ? "18" : "14"}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div className={`absolute top-full left-0 right-0 mt-1 ${fullWidth ? '' : 'min-w-[180px]'} max-h-60 overflow-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50`}>
                        {options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                className={`
                                    w-full flex items-center justify-between px-4 py-3
                                    text-sm text-left border-b border-slate-50 last:border-0
                                    transition-colors
                                    ${value === option
                                        ? 'bg-sky-50 text-sky-600 font-semibold'
                                        : 'text-slate-700 hover:bg-slate-50'
                                    }
                                `}
                            >
                                <span>{option}</span>
                                {value === option && (
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="text-sky-500"
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default Dropdown;
