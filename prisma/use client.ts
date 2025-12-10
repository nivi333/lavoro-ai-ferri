'use client'
import React, { useCallback, useEffect, useState } from "react"
import { useTheme } from 'next-themes'
import { useSettings } from '@/hooks/useSettings'
import type { Mode } from '@/contexts/settingsContext'
import { ThemeToggleButton, useThemeTransition } from "@/components/ui/shadcn-io/theme-toggle-button"
const ThemeToggleVariantsDemo = () => {
  const { setTheme } = useTheme()
  const { settings, updateSettings } = useSettings()
  const { startTransition } = useThemeTransition()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const handleThemeToggle = useCallback(() => {
    const newMode: Mode = settings.mode === 'dark' ? 'light' : 'dark'
    
    startTransition(() => {
      const updatedSettings = {
        ...settings,
        mode: newMode,
        theme: {
          ...settings.theme,
          styles: {
            light: settings.theme.styles?.light || {},
            dark: settings.theme.styles?.dark || {}
          }
        }
      }
      updateSettings(updatedSettings)
      setTheme(newMode)
    })
  }, [settings, updateSettings, setTheme, startTransition])
  const currentTheme = settings.mode === 'system' ? 'light' : settings.mode as 'light' | 'dark'
  if (!mounted) {
    return null
  }
  return (
    <div className="flex items-center justify-center gap-8 p-8">
      {/* Circle animation */}
      <div className="flex flex-col items-center gap-3">
        <ThemeToggleButton 
          theme={currentTheme}
          onClick={handleThemeToggle}
          variant="circle"
          start="center"
        />
        <div className="text-center">
          <span className="text-xs font-medium">Circle</span>
          <p className="text-xs text-muted-foreground">Expanding circle</p>
        </div>
      </div>
      {/* Circle blur animation */}
      <div className="flex flex-col items-center gap-3">
        <ThemeToggleButton 
          theme={currentTheme}
          onClick={handleThemeToggle}
          variant="circle-blur"
          start="top-right"
        />
        <div className="text-center">
          <span className="text-xs font-medium">Circle Blur</span>
          <p className="text-xs text-muted-foreground">Soft-edge circle</p>
        </div>
      </div>
      {/* Polygon animation */}
      <div className="flex flex-col items-center gap-3">
        <ThemeToggleButton 
          theme={currentTheme}
          onClick={handleThemeToggle}
          variant="polygon"
        />
        <div className="text-center">
          <span className="text-xs font-medium">Polygon</span>
          <p className="text-xs text-muted-foreground">Diagonal wipe</p>
        </div>
      </div>
      {/* GIF animation */}
      <div className="flex flex-col items-center gap-3">
        <ThemeToggleButton 
          theme={currentTheme}
          onClick={handleThemeToggle}
          variant="gif"
          url="https://media.giphy.com/media/KBbr4hHl9DSahKvInO/giphy.gif?cid=790b76112m5eeeydoe7et0cr3j3ekb1erunxozyshuhxx2vl&ep=v1_stickers_search&rid=giphy.gif&ct=s"
        />
        <div className="text-center">
          <span className="text-xs font-medium">GIF Mask</span>
          <p className="text-xs text-muted-foreground">Custom animation</p>
        </div>
      </div>
    </div>
  )
}
export default ThemeToggleVariantsDemo
