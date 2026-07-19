import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { useSidebarStore } from "@/store/useSidebarStore";
import { SidebarContent } from "./SidebarContent";

export function NavigationDrawer() {
  const { isOpen, setOpen } = useSidebarStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setOpen]);

  // Handle focus trapping
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay (Backdrop) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 z-[100] bg-black/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            className="absolute top-0 left-0 bottom-0 z-[101] w-[300px] max-w-[85vw] bg-white shadow-[10px_0_40px_rgba(0,0,0,0.1)] outline-none overflow-hidden"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.x < -50 || velocity.x < -500) {
                setOpen(false);
              }
            }}
          >
            <SidebarContent />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
