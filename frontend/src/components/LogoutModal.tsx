import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoutModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ open, onClose, onConfirm }: LogoutModalProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      onConfirm();
    }, 800);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-card-hover mx-4 text-center" onClick={e => e.stopPropagation()}>
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-destructive/10 mb-4">
              {loggingOut ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Check className="h-7 w-7 text-destructive" />
                </motion.div>
              ) : (
                <LogOut className="h-7 w-7 text-destructive" />
              )}
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Confirm Logout</h2>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to sign out?</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose} disabled={loggingOut}>Cancel</Button>
              <Button className="flex-1 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleLogout} disabled={loggingOut}>
                {loggingOut ? "Signing out..." : "Logout"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
