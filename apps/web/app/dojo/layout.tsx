import { SocketProvider } from '@/lib/socket';

export default function DojoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SocketProvider>
            <div className="min-h-screen flex flex-col pt-20">
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </SocketProvider>
    );
}
