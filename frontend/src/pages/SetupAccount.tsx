import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Mail, Lock, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const SetupAccount = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const { registerNumber, role } = location.state || {};

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!registerNumber) {
            navigate("/verify-profile");
        }
    }, [registerNumber, navigate]);

    const calculateStrength = (pass: string) => {
        let strength = 0;
        if (pass.length >= 8) strength++;
        if (/[A-Z]/.test(pass)) strength++;
        if (/[0-9]/.test(pass)) strength++;
        if (/[^A-Za-z0-9]/.test(pass)) strength++;
        return strength;
    };

    const pStrength = calculateStrength(password);

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !confirmPassword) {
            toast.error("Please fill in all fields");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (pStrength < 3) {
            toast.error("Please choose a stronger password");
            return;
        }

        setIsLoading(true);
        try {
            // 1. Create user on backend and mark as Active
            const response = await fetchApi('/auth/setup-account', {
                method: 'POST',
                body: JSON.stringify({ registerNumber, role, password, email }),
            });

            // 2. Log them in directly using the newly created credentials
            await login(registerNumber, password, role);

            toast.success("Account setup complete! Welcome.");

            navigate("/teacher/dashboard");

        } catch (error: any) {
            toast.error(error.message || "Failed to setup account");
        } finally {
            setIsLoading(false);
        }
    };

    if (!registerNumber) return null;

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-40 -left-20 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-card rounded-[20px] shadow-card p-8 space-y-8 border-t-4 border-primary">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="flex flex-col items-center gap-3 text-center"
                    >
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] shadow-glow">
                            <ShieldCheck className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Setup Account</h1>
                        <p className="text-sm text-muted-foreground">
                            Create your secure login credentials
                        </p>
                    </motion.div>

                    <form onSubmit={handleSetup} className="space-y-5">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-2"
                        >
                            <label className="text-sm font-medium text-foreground">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="pl-10 rounded-xl h-12"
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.35 }}
                            className="space-y-2"
                        >
                            <label className="text-sm font-medium text-foreground">Create Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Create a strong password"
                                    className="pl-10 rounded-xl h-12"
                                />
                            </div>
                            {/* Password Strength Indicator */}
                            {password && (
                                <div className="flex gap-1 mt-2">
                                    {[1, 2, 3, 4].map((level) => (
                                        <div
                                            key={level}
                                            className={`h-1.5 flex-1 rounded-full transition-all ${pStrength >= level
                                                    ? pStrength < 3 ? 'bg-warning' : 'bg-success'
                                                    : 'bg-border'
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-2"
                        >
                            <label className="text-sm font-medium text-foreground">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    className="pl-10 rounded-xl h-12"
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="pt-4"
                        >
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white font-semibold text-base shadow-glow hover:opacity-90 transition-all duration-200 group"
                            >
                                {isLoading ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                        className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full"
                                    />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Complete Setup
                                        <Check className="h-4 w-4" />
                                    </span>
                                )}
                            </Button>
                        </motion.div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default SetupAccount;
