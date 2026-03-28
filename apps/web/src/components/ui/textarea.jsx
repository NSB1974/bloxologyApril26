import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  const reactId = React.useId()
  const fallbackId = `textarea-${reactId.replace(/:/g, "")}`
  const textareaId = props.id || props.name || fallbackId
  const textareaName = props.name || props.id || fallbackId

  return (
    <textarea
      id={textareaId}
      name={textareaName}
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props} />
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
