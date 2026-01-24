// Clean reader layout - no header, footer, or bottom nav
// This ensures ReaderContent's own header and controls are visible
export default function ChapterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
