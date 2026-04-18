import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const AuthCallback = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Processing...');

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Check if this is an email confirmation
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const type = hashParams.get('type');
                const error = hashParams.get('error');
                const errorDescription = hashParams.get('error_description');

                if (error) {
                    setStatus('error');
                    setMessage(errorDescription || 'Authentication failed');
                    toast({
                        title: "Error",
                        description: errorDescription || 'Authentication failed',
                        variant: "destructive"
                    });

                    // Redirect to login after 3 seconds
                    setTimeout(() => navigate('/staff-login'), 3000);
                    return;
                }

                if (type === 'signup' || type === 'email' || accessToken) {
                    // Email confirmation successful
                    setStatus('success');
                    setMessage('Email confirmed successfully! Redirecting...');

                    toast({
                        title: "Success!",
                        description: "Your email has been confirmed. You can now log in.",
                    });

                    // Redirect to login page after 2 seconds
                    setTimeout(() => navigate('/staff-login'), 2000);
                } else {
                    // No token found, might be an error
                    setStatus('error');
                    setMessage('Invalid confirmation link');
                    setTimeout(() => navigate('/staff-login'), 3000);
                }
            } catch (err: any) {
                console.error('Auth callback error:', err);
                setStatus('error');
                setMessage('An error occurred during authentication');
                toast({
                    title: "Error",
                    description: err.message || 'An error occurred',
                    variant: "destructive"
                });
                setTimeout(() => navigate('/staff-login'), 3000);
            }
        };

        handleAuthCallback();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-4">
                {status === 'loading' && (
                    <>
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-lg text-muted-foreground">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-green-600">Success!</h1>
                        <p className="text-muted-foreground">{message}</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-red-600">Error</h1>
                        <p className="text-muted-foreground">{message}</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthCallback;
