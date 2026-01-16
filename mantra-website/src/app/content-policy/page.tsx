import Link from 'next/link';

export default function ContentPolicyPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">Content Policy</h1>

            <div className="prose prose-lg max-w-none text-[var(--foreground)]">
                <p className="text-[var(--foreground-secondary)]">
                    These guidelines help maintain a safe, welcoming environment for all users.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4 text-emerald-600">✓ What's Allowed</h2>
                <ul className="list-disc pl-6 text-[var(--foreground-secondary)]">
                    <li>Original fiction in any genre (fantasy, romance, sci-fi, mystery, etc.)</li>
                    <li>Fan fiction with proper disclaimers</li>
                    <li>Mature themes with appropriate content warnings</li>
                    <li>Violence within storytelling context</li>
                    <li>Multiple language submissions</li>
                </ul>

                <h2 className="text-xl font-bold mt-8 mb-4 text-red-600">✗ What's Not Allowed</h2>
                <ul className="list-disc pl-6 text-[var(--foreground-secondary)]">
                    <li><strong>Plagiarism:</strong> Copying others' work without permission</li>
                    <li><strong>Hate Speech:</strong> Content targeting race, religion, gender, etc.</li>
                    <li><strong>Illegal Content:</strong> Including promotion of illegal activities</li>
                    <li><strong>Harassment:</strong> Targeting real individuals</li>
                    <li><strong>Spam:</strong> Low-quality or AI-generated bulk content</li>
                    <li><strong>Explicit minors:</strong> No sexual content involving minors</li>
                </ul>

                <h2 className="text-xl font-bold mt-8 mb-4">Content Ratings</h2>
                <div className="grid gap-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <h3 className="font-semibold text-emerald-700">🟢 Everyone</h3>
                        <p className="text-sm text-[var(--foreground-secondary)]">Suitable for all ages</p>
                    </div>
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <h3 className="font-semibold text-amber-700">🟡 Teen (13+)</h3>
                        <p className="text-sm text-[var(--foreground-secondary)]">Mild violence, some romance</p>
                    </div>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <h3 className="font-semibold text-red-700">🔴 Mature (18+)</h3>
                        <p className="text-sm text-[var(--foreground-secondary)]">Explicit content, graphic violence</p>
                    </div>
                </div>

                <h2 className="text-xl font-bold mt-8 mb-4">Enforcement</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    Violations may result in content removal, account warnings, or permanent bans depending on severity. If you see content that violates these policies, please <Link href="/report" className="text-[var(--primary)] hover:underline">report it</Link>.
                </p>
            </div>
        </div>
    );
}
