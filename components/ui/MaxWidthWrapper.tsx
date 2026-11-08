import { ReactNode } from "react";
import { cn } from "cn";
const MaxWidthWrapper = ({ className, children }: { className?: string; children: ReactNode }) => {
  return <div className={cn("mx-auto w-full max-w-7xl px-2.5 md:px-20 h-full", className)}>{children}</div>;
};

export default MaxWidthWrapper;
