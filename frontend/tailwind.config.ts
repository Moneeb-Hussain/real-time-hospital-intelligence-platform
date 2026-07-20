import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    extend: {
      colors: {
        'bg-page': '#F8FAFC', // Sterile, clean neutral background (Slate-50)
        'bg-card': '#FFFFFF',
        'bg-sidebar': '#FFFFFF',
        'bg-sidebar-hover': '#F0F9FF', // Clean cyan-tinted slate hover
        border: '#E2E8F0', // Clean Slate border
        'border-strong': '#CBD5E1',
        brand: { DEFAULT:'#0D9488', 50:'#F0FDFA', 100:'#CCFBF1', 500:'#0D9488', 600:'#0D9488', 700:'#0F766E' }, // Premium MedTech Deep Teal
        accent: { DEFAULT:'#3B82F6', 50:'#EFF6FF', 100:'#DBEAFE', 500:'#3B82F6', 600:'#2563EB' }, // Slate Blue secondary actions
        ai: { DEFAULT:'#6366F1', 50:'#EEF2F6', 100:'#E0E7FF', 500:'#6366F1', 600:'#4F46E5', 700:'#4338CA' }, // Intelligent Violet for AI recommendations
        critical: { DEFAULT:'#EF4444', bg:'#FEF2F2', border:'#FECACA' },
        warning:  { DEFAULT:'#F59E0B', bg:'#FFFBEB', border:'#FDE68A' },
        success:  { DEFAULT:'#10B981', bg:'#ECFDF5', border:'#D1FAE5' },
        info:     { DEFAULT:'#3B82F6', bg:'#EFF6FF', border:'#DBEAFE' },
        p1: { DEFAULT:'#EF4444', bg:'#FEF2F2', text:'#B91C1C' },
        p2: { DEFAULT:'#F59E0B', bg:'#FFFBEB', text:'#B45309' },
        p3: { DEFAULT:'#3B82F6', bg:'#EFF6FF', text:'#1D4ED8' },
        p4: { DEFAULT:'#10B981', bg:'#ECFDF5', text:'#047857' },
        'text-primary':   '#0F172A', // Slate 900 for high-contrast readability
        'text-secondary': '#475569', // Slate 600
        'text-tertiary':  '#94A3B8', // Slate 400
        'text-inverse':   '#FFFFFF',
        'text-sidebar':   '#475569',
        'text-sidebar-active': '#0F172A'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        button: '6px',
        badge: '4px',
        chip: '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.05)',
        'card-hover': '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        'slide-over': '-4px 0 24px rgba(0,0,0,0.12)',
      },
      keyframes: {
        'fade-in-up': { '0%':{ opacity:'0', transform:'translateY(8px)' }, '100%':{ opacity:'1', transform:'translateY(0)' } },
        'row-flash':  { '0%':{ backgroundColor:'rgba(37,99,235,0.15)' }, '100%':{ backgroundColor:'transparent' } },
        'slide-in-right': { '0%':{ transform:'translateX(100%)' }, '100%':{ transform:'translateX(0)' } },
        'pulse-ring': { '0%':{ transform:'scale(1)', opacity:'1' }, '100%':{ transform:'scale(2)', opacity:'0' } },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s ease-out',
        'row-flash': 'row-flash 1.2s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
