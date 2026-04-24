import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Mail, ShieldCheck, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import logoImg from '@/assets/logo.png';

/* Sidebar brand tokens */
const BLUE   = "#155E75";   /* sidebar background hsl(194,70%,27%)   */
const BLUE_D = "#0F4A5C";   /* dark gradient stop hsl(194,75%,22%)   */
const BLUE_L = "#06B6D4";   /* sidebar primary cyan                  */
const ORANGE = "#06B6D4";   /* cyan accent — active/highlight        */

const AdminLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [userId, setUserId]             = useState("");
    const [password, setPassword]         = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading]       = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !password) {
            toast.error("Please enter both Admin ID and Password");
            return;
        }
        setIsLoading(true);
        try {
            const activeRole = await login(userId, password, "admin");
            if (activeRole !== "admin") {
                throw new Error("Unauthorized access. Admin privileges required.");
            }
            toast.success("Admin login successful!");
            navigate("/admin/dashboard");
        } catch (error: any) {
            toast.error(error.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">

            {/* ── Left Panel ──────────────────────────────────────────────────── */}
            <div
                className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 xl:p-16 pr-24 relative overflow-hidden"
                style={{ background: `linear-gradient(155deg, ${BLUE_D} 0%, ${BLUE} 55%, ${BLUE_L} 100%)` }}
            >
                {/* Decorative rings */}
                <div className="absolute -top-28 -right-28 w-96 h-96 rounded-full border border-white/10" />
                <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-white/10" />
                <div className="absolute -bottom-32 -left-20 w-[28rem] h-[28rem] rounded-full border border-white/10" />
                <div className="absolute -bottom-20 -left-8  w-72 h-72 rounded-full border border-white/10" />
                {/* Light cyan shade softens the center transition without adding a hard line. */}
                <div
                    className="absolute inset-y-0 right-0 w-20 pointer-events-none"
                    style={{ background: "linear-gradient(to right, transparent, rgba(6,182,212,0.22), rgba(255,255,255,0.18))" }}
                />
                {/* Curved white wave creates a soft, intentional transition into the form area. */}
                <svg
                    className="absolute inset-y-0 -right-px h-full w-28 text-white pointer-events-none drop-shadow-[-14px_0_24px_rgba(6,182,212,0.18)]"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <path
                        fill="currentColor"
                        d="M100 0H44C59 17 65 32 58 47C51 63 30 75 38 100H100V0Z"
                    />
                </svg>

                {/* Main copy */}
                <motion.div
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55, delay: 0.15 }}
                    className="relative z-10 space-y-7"
                >
                    {/* Shield badge */}
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.1)", border: `1px solid ${ORANGE}55` }}
                    >
                        <ShieldCheck className="h-8 w-8" style={{ color: ORANGE }} />
                    </div>

                    <div>
                        <h2 className="text-3xl xl:text-[2.6rem] font-extrabold text-white leading-tight mb-3">
                            Administration<br />Portal
                        </h2>
                        <p className="text-sm leading-relaxed text-white/65 max-w-xs">
                            Secure access for school administrators. Manage staff, students, academics and institutional operations from one unified platform.
                        </p>
                    </div>

                    {/* Feature list */}
                    <ul className="space-y-3">
                        {[
                            "Staff & student management",
                            "Academic records & scheduling",
                            "Reports & system configuration",
                        ].map((item) => (
                            <li key={item} className="flex items-center gap-3 text-sm text-white/75">
                                <span
                                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                    style={{ background: ORANGE, color: "#fff" }}
                                >✓</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </motion.div>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="relative z-10 text-xs text-white/35"
                >
                    Restricted access — authorised personnel only.
                </motion.p>
            </div>

            {/* ── Right Panel — Form ────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col justify-center items-center bg-white px-6 sm:px-10 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-md"
                >
                    {/* Logo & name */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-white shadow border border-gray-100 flex items-center justify-center flex-shrink-0">
                            <img src={logoImg} alt="Studyzone" className="h-10 w-10 object-contain" />
                        </div>
                        <div>
                            <p className="font-bold text-lg text-gray-900 leading-none">Studyzone</p>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mt-0.5">School Management</p>
                        </div>
                    </div>

                    {/* Badge */}
                    <div className="mb-5">
                        <span
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide"
                            style={{ background: `${BLUE}14`, color: BLUE, border: `1px solid ${BLUE}30` }}
                        >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Admin Access Only
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-[1.75rem] font-extrabold text-gray-900 mb-1">
                        Administrator Login
                    </h1>
                    <p className="text-sm text-gray-400 mb-7">
                        Sign in to manage your school's operations.
                    </p>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-5">

                        {/* Admin ID */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Admin ID / Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ width: "1.1rem", height: "1.1rem" }} />
                                <Input
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    autoComplete="username"
                                    className="pl-10 h-12 rounded-xl border-gray-200 bg-gray-50 text-sm text-gray-900 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ width: "1.1rem", height: "1.1rem" }} />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    className="pl-10 pr-11 h-12 rounded-xl border-gray-200 bg-gray-50 text-sm text-gray-900 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword
                                        ? <EyeOff style={{ width: "1.1rem", height: "1.1rem" }} />
                                        : <Eye    style={{ width: "1.1rem", height: "1.1rem" }} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl font-bold text-sm text-white shadow-md hover:opacity-90 transition-all duration-300 border-0"
                            style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_L} 100%)` }}
                        >
                            {isLoading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full"
                                />
                            ) : (
                                "Sign In to Admin Portal"
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-xs text-gray-300">or</span>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {/* Return to public login */}
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Return to Public Login
                    </button>

                    <p className="text-center text-xs text-gray-300 mt-8 leading-relaxed">
                        This portal is for authorised school administrators only.<br />
                        Unauthorised access attempts are logged and monitored.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminLogin;
