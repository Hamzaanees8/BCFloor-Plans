"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  useEffect(() => {
    // Delays
    const showCloseButtonDelay = 5000 // 5 seconds
    const forceDismissDelay = 10000 // 10 seconds
    
    const toastTimers = new Map<
      Element,
      { showTimer: ReturnType<typeof setTimeout>; dismissTimer: ReturnType<typeof setTimeout> }
    >()

    const showCloseButton = (toastElement: Element) => {
      toastElement.classList.add("show-close-button")
    }

    const checkAndDismiss = (toastElement: Element) => {
      const closeButton = toastElement.querySelector("[data-close-button]")
      if (closeButton instanceof HTMLElement) {
        closeButton.click()
      } else {
        toastElement.remove()
      }
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Check for new toast elements added to DOM
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            const toasts = node.hasAttribute("data-sonner-toast")
              ? [node]
              : Array.from(node.querySelectorAll("[data-sonner-toast]"))

            for (const toastEl of toasts) {
              if (!toastTimers.has(toastEl)) {
                // Timer to show close button after 10 seconds
                const showTimer = setTimeout(() => {
                  if (document.body.contains(toastEl)) {
                    showCloseButton(toastEl)
                  }
                }, showCloseButtonDelay)

                // Timer to force dismiss after 20 seconds
                const dismissTimer = setTimeout(() => {
                  if (document.body.contains(toastEl)) {
                    checkAndDismiss(toastEl)
                  }
                  toastTimers.delete(toastEl)
                }, forceDismissDelay)

                toastTimers.set(toastEl, { showTimer, dismissTimer })
              }
            }
          }
        }

        // Clean up timers for removed toast elements
        for (const node of mutation.removedNodes) {
          if (node instanceof HTMLElement) {
            const toasts = node.hasAttribute("data-sonner-toast")
              ? [node]
              : Array.from(node.querySelectorAll("[data-sonner-toast]"))

            for (const toastEl of toasts) {
              const timers = toastTimers.get(toastEl)
              if (timers) {
                clearTimeout(timers.showTimer)
                clearTimeout(timers.dismissTimer)
                toastTimers.delete(toastEl)
              }
            }
          }
        }
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
      for (const timers of toastTimers.values()) {
        clearTimeout(timers.showTimer)
        clearTimeout(timers.dismissTimer)
      }
      toastTimers.clear()
    }
  }, [])

  return (
    <>
      <style>{`
        /* Hide close button by default */
        [data-sonner-toast] [data-close-button] {
          display: none !important;
        }
        /* Show close button when toast has show-close-button class */
        [data-sonner-toast].show-close-button [data-close-button] {
          display: flex !important;
          position: absolute !important;
          top: 8px !important;
          right: 8px !important;
          left: auto !important;
          transform: none !important;
          background-color: hsl(var(--background, 0 0% 100%)) !important;
          border: 1px solid hsl(var(--border, 240 5.9% 90%)) !important;
          color: hsl(var(--foreground, 240 10% 3.9%)) !important;
          opacity: 1 !important;
          z-index: 50 !important;
          cursor: pointer !important;
        }
        [data-sonner-toast].show-close-button [data-close-button]:hover {
          background-color: hsl(var(--muted, 240 4.8% 95.9%)) !important;
          color: hsl(var(--foreground, 240 10% 3.9%)) !important;
        }
      `}</style>
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group"
        closeButton={true}
        toastOptions={{
          classNames: {
            toast:
              "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
            description: "group-[.toast]:text-muted-foreground",
            actionButton:
              "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
            cancelButton:
              "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          },
        }}
        {...props}
      />
    </>
  )
}

export { Toaster }

