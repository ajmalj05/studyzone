import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import logoImg from "@/assets/logo.png";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const role = "teacher" as const;
    const [registerNumber, setRegisterNumber] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleNext = async () => {
        if (!registerNumber) {
            toast.error("Please enter your Register Number / User ID");
            return;
        }

        setIsLoading(true);
        try {
            const data = await fetchApi('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ registerNumber, role }),
            });

            // Simulating sending OTP. In a real scenario, this is where Supabase OTP happens.
            setTimeout(() => {
                navigate('/verify-otp', {
                    state: {
                        phone: data.phone,
                        registerNumber,
                        role,
                        mode: 'reset'
                    }
                });
                toast.success(`OTP sent to ${data.phone}`);
                setIsLoading(false);
            }, 1500);

        } catch (error: any) {
            toast.error(error.message || "Failed to find account");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] mix-blend-multiply opacity-50 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] mix-blend-multiply opacity-50 animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="w-full max-w-md relative z-10">
                <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors group">
                    <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to Login
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="bg-card rounded-2xl shadow-card p-8 border border-border/50 backdrop-blur-sm"
                >
                    {/* Logo & Header */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="flex flex-col items-center gap-4 mb-8"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150 animate-pulse" />
                            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-glow overflow-hidden bg-card">
                                <img src={logoImg} alt="Studyzone" className="h-12 w-12 object-contain" />
                            </div>
                        </div>
                        <div className="text-center space-y-1">
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent gradient-primary drop-shadow-sm">Reset Password</h1>
                            <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                                Enter your details to receive an authentication code
                            </p>
                        </div>
                    </motion.div>

                    <div className="space-y-6">
                        {/* Input Field */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-foreground">Register Number / User ID</label>
                            <div className="relative group">
                                <Input
                                    value={registerNumber}
                                    onChange={(e) => setRegisterNumber(e.target.value.toUpperCase())}
                                    placeholder="e.g., TCH-001"
                                    className="h-12 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-all duration-300 uppercase px-4 ring-offset-background focus-visible:ring-primary/30"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleNext}
                            disabled={isLoading || !registerNumber}
                            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-base shadow-glow hover:shadow-glow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-glow group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                            <span className="relative flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                        className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                                    />
                                ) : (
                                    <>
                                        Send OTP <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                        </Button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPassword;
