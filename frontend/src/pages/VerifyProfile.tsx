import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import logoImg from "@/assets/logo.png";

const VerifyProfile = () => {
    const navigate = useNavigate();
    const role = "teacher" as const;
    const [registerNumber, setRegisterNumber] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!registerNumber) {
            toast.error("Please enter your Register Number");
            return;
        }

        setIsLoading(true);
        try {
            const dbResponse = await fetchApi('/auth/verify-profile', {
                method: 'POST',
                body: JSON.stringify({ registerNumber, role }),
            });

            // dbResponse should contain { message, phone, name }
            toast.success("Profile found! Preparing verification...");

            // In real life, here we might trigger Supabase OTP using Phone.
            // e.g. await supabase.auth.signInWithOtp({ phone: dbResponse.phone })

            // Move to OTP screen
            navigate("/verify-otp", { state: { registerNumber, role, phone: dbResponse.phone } });
        } catch (error: any) {
            toast.error(error.message || "Profile verification failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
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
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-glow overflow-hidden p-1">
                            <img src={logoImg} alt="Studyzone" className="h-full w-full object-contain" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Verify Profile</h1>
                        <p className="text-sm text-muted-foreground">University Account Activation</p>
                    </motion.div>

                    <form onSubmit={handleVerify} className="space-y-6">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-2"
                        >
                            <label className="text-sm font-medium text-foreground">Register Number</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={registerNumber}
                                    onChange={(e) => setRegisterNumber(e.target.value)}
                                    placeholder="Enter your Register Number"
                                    className="pl-10 rounded-xl h-12"
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="pt-2"
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
                                        Verify Profile
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </span>
                                )}
                            </Button>
                        </motion.div>
                    </form>

                    <p className="text-center text-xs text-muted-foreground">
                        Contact administration if you haven't received a register number.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default VerifyProfile;
