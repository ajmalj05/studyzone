import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Lock, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import mascotImg from '@/assets/mascot.png';
import logoImg from '@/assets/logo.png';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<"teacher" | "parent">("teacher");
  const [userId, setUserId] = useState("T1001");
  const [password, setPassword] = useState("password");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !password) {
      toast.error("Please enter both User ID and Password");
      return;
    }

    setIsLoading(true);
    try {
      const activeRole = await login(userId, password, role);
      toast.success("Login successful!");

      if (role === "teacher") navigate("/teacher/dashboard");
      else navigate("/parent/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-3 py-6 sm:px-4 sm:py-10 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-4xl md:max-w-3xl bg-card rounded-[20px] shadow-card overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left Side: Login Form - scales within outer box, no scroll */}
        <div className="w-full md:w-1/2 min-w-0 flex flex-col p-4 sm:p-6 md:p-6 lg:p-8 justify-center">
          {/* Logo & Title - scale with container, no overflow */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8 flex-shrink-0">
            <img src={logoImg} alt="Studyzone" className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 object-contain flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate min-w-0">Studyzone</h1>
          </div>

          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-4 sm:mb-6 md:mb-8 flex-shrink-0">
            {role === "teacher" ? "Teacher Login" : "Parent Login"}
          </h2>

          {/* Form - spacing scales */}
          <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4 md:space-y-5 flex-shrink-0">
            {/* Role Switcher */}
            <div className="flex p-1 bg-background rounded-xl mb-4 sm:mb-6">
              {(["teacher", "parent"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    if (r === "teacher") {
                      setUserId("T1001");
                      setPassword("password");
                    } else {
                      setUserId("P1001");
                      setPassword("password");
                    }
                  }}
                  className={`flex-1 flex justify-center py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all min-w-0 ${role === r
                    ? "bg-card shadow-sm text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-1.5 sm:space-y-2"
            >
              <label className="text-xs sm:text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-9 sm:pl-10 rounded-xl h-10 sm:h-12 border-border hover:border-accent focus:border-ring focus:ring-ring bg-card text-sm sm:text-base"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-1.5 sm:space-y-2"
            >
              <label className="text-xs sm:text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-9 sm:pl-10 rounded-xl h-10 sm:h-12 border-border hover:border-accent focus:border-ring focus:ring-ring bg-card text-sm sm:text-base"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="pt-1 sm:pt-2"
            >
              <div className="flex justify-end mb-4 sm:mb-6">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs sm:text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 sm:h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-300"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  "Login"
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-border flex-shrink-0"
          >
            <p className="text-xs sm:text-sm text-muted-foreground">
              Don't have an account yet?
              <button
                onClick={() => navigate('/verify-profile')}
                className="ml-1 text-primary font-semibold hover:text-primary/80 hover:underline transition-colors"
              >
                Register
              </button>
            </p>
          </motion.div>

          {/* Admin Login Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center pt-1 sm:pt-2 mt-1 sm:mt-2 flex-shrink-0"
          >
            <Link
              to="/admin-login"
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin Portal Access
            </Link>
          </motion.div>
        </div>

        {/* Right Side: Illustration - scales within outer box */}
        <div className="hidden md:flex md:w-1/2 min-w-0 bg-background p-4 lg:p-8 items-center justify-center relative overflow-hidden border-l border-border">
          {/* Subtle radial glow behind the bird - made it blend more */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle,var(--tw-gradient-stops))] from-border/80 via-border/40 to-transparent rounded-full opacity-100 blur-2xl" />

          {/* Decorative Background Elements */}
          <div className="absolute top-10 right-10 w-24 h-24 bg-accent rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-primary/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative z-10 w-full max-w-[min(100%,450px)] max-h-full aspect-square flex items-center justify-center"
          >
            <div className="w-full h-full min-w-0 min-h-0">
              <img
                src={mascotImg}
                alt="School Mascot"
                className="w-full h-full object-contain mix-blend-multiply"
                style={{
                  filter: 'drop-shadow(0 15px 25px rgba(6, 182, 212, 0.15))',
                  maskImage: 'radial-gradient(circle at center, black 65%, transparent 100%)',
                  WebkitMaskImage: 'radial-gradient(circle at center, black 65%, transparent 100%)'
                }}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
