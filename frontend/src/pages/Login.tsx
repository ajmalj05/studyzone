import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import mascotImg from '@/assets/mascot.png';
import logoImg from '@/assets/logo.png';

const teacherModelImageUrl = "https://upload.wikimedia.org/wikipedia/commons/a/a2/English_Class_in_School.jpg";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const fixedRole = useMemo<"teacher" | "parent" | null>(() => {
    if (location.pathname === "/teacher" || location.pathname === "/teacher-login") return "teacher";
    if (location.pathname === "/" || location.pathname === "/login") return "parent";
    return null;
  }, [location.pathname]);
  const [role, setRole] = useState<"teacher" | "parent">(fixedRole ?? "parent");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isTeacherView = (fixedRole ?? role) === "teacher";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !password) {
      toast.error("Please enter both Username and Password");
      return;
    }

    setIsLoading(true);
    try {
      const selectedRole = fixedRole ?? role;
      await login(userId, password, selectedRole);
      toast.success("Login successful!");

      if (selectedRole === "teacher") navigate("/teacher/dashboard");
      else navigate("/parent/dashboard");
    } catch (error: unknown) {
      toast.error((error as Error).message || "Login failed");
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
        className={`w-full max-w-4xl md:max-w-3xl rounded-[20px] shadow-card overflow-hidden flex flex-col md:flex-row ${isTeacherView ? "bg-slate-900" : "bg-card"}`}
      >
        {/* Left Side: Login Form - scales within outer box, no scroll */}
        <div className={`w-full md:w-1/2 min-w-0 flex flex-col p-4 sm:p-6 md:p-6 lg:p-8 justify-center ${isTeacherView ? "bg-white" : ""}`}>
          {/* Logo & Title - scale with container, no overflow */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8 flex-shrink-0">
            <img src={logoImg} alt="Studyzone" className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 object-contain flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate min-w-0">Studyzone</h1>
          </div>

          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-4 sm:mb-6 md:mb-8 flex-shrink-0">
            {isTeacherView ? "Teacher Portal Login" : "Parent Login"}
          </h2>
          {isTeacherView && (
            <p className="text-xs sm:text-sm text-muted-foreground -mt-3 mb-5 sm:mb-6">
              Sign in to manage attendance, marks, and classroom activities.
            </p>
          )}

          {/* Form - spacing scales */}
          <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4 md:space-y-5 flex-shrink-0">
            {/* Role Switcher */}
            {!fixedRole && (
              <div className="flex p-1 bg-background rounded-xl mb-4 sm:mb-6">
                {(["teacher", "parent"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setUserId("");
                      setPassword("");
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
            )}

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-1.5 sm:space-y-2"
            >
              <label className="text-xs sm:text-sm font-medium text-foreground">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder=""
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
                  placeholder=""
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

          {isTeacherView && (
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
          )}

        </div>

        {/* Right Side: Full image */}
        <div className="hidden md:block md:w-1/2 min-w-0 relative overflow-hidden border-l border-border">
          <img
            src={isTeacherView ? teacherModelImageUrl : logoImg}
            alt={isTeacherView ? "Teacher Portal" : "Parent Portal"}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
