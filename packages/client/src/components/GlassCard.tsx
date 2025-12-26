import { Box } from "@mui/material";
import type { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
};

export default function GlassCard({ children }: GlassCardProps) {
  return (
    <Box
      sx={{
        background: "rgba(255, 255, 255, 0.04)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)", // สำหรับ Safari
        borderRadius: "10px",
        border: "1px solid rgba(255, 255, 255, 0.56)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
        padding: 3,
      }}
    >
      {children}
    </Box>
  );
}