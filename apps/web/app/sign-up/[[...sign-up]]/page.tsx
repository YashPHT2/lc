import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="font-display text-4xl font-bold mb-2">
                        <span className="text-gradient">Join the</span>{' '}
                        <span className="text-white neon-text">Arena</span>
                    </h1>
                    <p className="text-muted-foreground">
                        Create your account and start your journey to becoming a coding beast
                    </p>
                </div>

                {/* Clerk Sign Up Component */}
                <SignUp
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
