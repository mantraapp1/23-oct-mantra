import Link from 'next/link';

export default function DMCAPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">DMCA Policy</h1>

            <div className="prose prose-lg max-w-none text-[var(--foreground)]">
                <p className="text-[var(--foreground-secondary)]">
                    Mantra Novel respects the intellectual property rights of others and expects users to do the same.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">Copyright Infringement</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    If you believe that content on Mantra Novel infringes your copyright, please submit a DMCA takedown notice with the following information:
                </p>

                <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl p-6 my-6">
                    <h3 className="font-semibold text-[var(--foreground)] mb-4">Required Information:</h3>
                    <ol className="list-decimal pl-6 text-[var(--foreground-secondary)]">
                        <li>Your physical or electronic signature</li>
                        <li>Identification of the copyrighted work claimed to be infringed</li>
                        <li>URL or other identification of the infringing material</li>
                        <li>Your contact information (address, phone, email)</li>
                        <li>A statement that you have a good faith belief that the use is not authorized</li>
                        <li>A statement that the information is accurate and you are authorized to act on behalf of the copyright owner</li>
                    </ol>
                </div>

                <h2 className="text-xl font-bold mt-8 mb-4">Submit a Claim</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    Send your DMCA notice to: <strong>dmca@mantra.run.place</strong>
                </p>
                <p className="text-[var(--foreground-secondary)] leading-relaxed mt-4">
                    Or use our <Link href="/report" className="text-[var(--primary)] hover:underline">Report Form</Link> and select "Copyright Infringement" as the issue type.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">Counter-Notification</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    If your content was removed and you believe it was done in error, you may submit a counter-notification. Contact us for the counter-notification process.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-4">Repeat Infringers</h2>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                    In accordance with the DMCA, we will terminate accounts of users who are repeat copyright infringers.
                </p>
            </div>
        </div>
    );
}
