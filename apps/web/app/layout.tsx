import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { GlobalBackground } from '@/components/GlobalBackground';

export const metadata: Metadata = {
    title: 'Project Beast | CodeColosseum',
    description: 'A professional platform for competitive coding mastery.',
    keywords: ['leetcode', 'coding', 'algorithms', 'training'],
    authors: [{ name: 'Project Beast Team' }],
    openGraph: {
        title: 'Project Beast',
        description: 'Master the Art of Code.',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider
            appearance={{
                baseTheme: dark,
                variables: {
                    colorPrimary: '#6366f1', // Indigo 500
                    colorBackground: '#020617', // Slate 950
                    colorInputBackground: '#0f172a', // Slate 900
                    colorInputText: '#ffffff',
                    colorText: '#f8fafc',
                    borderRadius: '0.5rem',
                    fontFamily: '"Inter", sans-serif',
                },
                elements: {
                    card: 'bg-beast-dark-200 border border-white/5',
                    formButtonPrimary: 'bg-beast-primary text-white hover:bg-beast-primary/90',
                },
            }}
        >
            <html lang="en" className="dark scroll-smooth">
                <head>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                    <link
                        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
                        rel="stylesheet"
                    />
                </head>
                <body className="font-sans antialiased text-foreground selection:bg-indigo-500/30 selection:text-white">
                    <div className="fixed inset-0 z-[-1]">
                        <GlobalBackground />
                    </div>
                    <Navbar />
                    {children}
                </body>
            </html>
        </ClerkProvider>
    );
}
