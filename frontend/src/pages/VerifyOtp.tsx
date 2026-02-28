import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const VerifyOtp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { registerNumber, role, phone, mode } = location.state || {};

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [timer, setTimer] = useState(120);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!registerNumber) {
            navigate("/verify-profile");
            return;
        }

        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [registerNumber, navigate]);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) value = value.slice(-1);
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value !== "" && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && otp[index] === "" && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpValue = otp.join("");
        if (otpValue.length < 6) {
            toast.error("Please enter the complete OTP");
            return;
        }

        setIsLoading(true);
        try {
            // Real implementation would verify against Supabase here
            // await supabase.auth.verifyOtp({ phone, token: otpValue, type: 'sms' })

            // For demonstration, simulating network request
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (otpValue === "123456") { // Replace with real check
                toast.success("OTP Verified Successfully");
                if (mode === "reset") {
                    navigate("/reset-password", { state: { registerNumber, role } });
                } else {
                    navigate("/setup-account", { state: { registerNumber, role } });
                }
            } else {
                toast.error("Invalid OTP. For demo use 123456");
            }
        } catch (error: any) {
            toast.error(error.message || "OTP verification failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = () => {
        setTimer(120);
        toast.success(`OTP resent to ${phone.replace(/.(?=.{4})/g, '*')}`);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (!registerNumber) return null;

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-20 left-20 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
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
                            <KeyRound className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">OTP Verification</h1>
                        <p className="text-sm text-muted-foreground">
                            Enter the verification code sent to <br />
                            <span className="font-semibold text-foreground">{phone?.replace(/.(?=.{4})/g, '*')}</span>
                        </p>
                    </motion.div>

                    <form onSubmit={handleVerify} className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex justify-between gap-2"
                        >
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`otp-${index}`}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                />
                            ))}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-center justify-between text-sm"
                        >
                            <span className="text-muted-foreground">
                                Time remaining: <span className="font-medium text-foreground">{formatTime(timer)}</span>
                            </span>
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={timer > 0}
                                className={`flex items-center gap-1 font-medium transition-colors ${timer > 0 ? "text-muted-foreground cursor-not-allowed" : "text-primary hover:text-primary/80"
                                    }`}
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Resend OTP
                            </button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
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
                                        Verify OTP
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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

export default VerifyOtp;
