import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { MigraCheckApp } from "@/components/migracheck/MigraCheckApp";
import "./styles.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MigraCheckApp />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  </StrictMode>,
);
