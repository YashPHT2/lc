import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="font-display text-4xl font-bold text-white mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-muted-foreground">
                        Sign in to continue your coding journey
                    </p>
                </div>

                {/* Clerk Sign In Component */}
                <SignIn
                    appearance={{
                        elements: {
                            rootBox: 'w-full',
                            card: 'cyber-card w-full',
                        }
                    }}
                />
            </div>
        </div>
    );
}
