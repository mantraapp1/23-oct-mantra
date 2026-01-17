"use client";

import React from 'react';
import Link from 'next/link';

interface HorizontalSectionProps {
    title: string;
    viewAllLink?: string;
    children: React.ReactNode;
}

export default function HorizontalSection({ title, viewAllLink, children }: HorizontalSectionProps) {
    return (
        <section className="mt-8">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 mb-4">
                <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">{title}</h2>
                {viewAllLink && (
                    <Link
                        href={viewAllLink}
                        className="text-sm font-semibold text-[var(--primary)] hover:text-sky-600 transition-colors"
                    >
                        See all
                    </Link>
                )}
            </div>

            <div className="flex overflow-x-auto pb-6 px-4 sm:px-6 lg:px-8 gap-4 snap-x snap-mandatory scrollbar-hide -mx-4 sm:mx-0 sm:px-0">
                {/* Mobile: Negative margin hack for edge-to-edge scroll with padding */}
                {children}
            </div>
        </section>
    );
}
