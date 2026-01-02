# UI/UX Standards

## Core Philosophy
- **Modern & Clean**: Use glassmorphism, ample whitespace, and subtle gradients.
- **Data-First**: Charts and metrics should be the focal point.

## Typography
- **Font Family**: `Inter` (Sans-Serif)
- **Headings**: Bold/Black weights, tight tracking.
- **Monospace**: `JetBrains Mono` for code or transaction references.

## Color Palette (Tailwind)
- **Primary**: `blue-600` (Light) / `blue-500` (Dark)
- **Background**:
    - Light: `white` / `zinc-50`
    - Dark: `zinc-950` / `zinc-900`
- **Surface/Card**:
    - Light: `white` with `shadow-xl`
    - Dark: `zinc-900/50` with `backdrop-blur-xl` and `border-zinc-800`
- **Charts (Tremor)**:
    - Income: `emerald-500`
    - Expense: `rose-500`
    - Fixed Costs: `blue-500`

## Components
- **Buttons**: Rounded-xl, clear hover states.
- **Inputs**: Rounded-xl, `bg-zinc-50/50` (dark: `bg-zinc-950/50`).
- **Icons**: Lucide React only.

## Grid & Layout
- **Max Width**: `max-w-[1400px]` centered.
- **Responsive**: Mobile-first stack -> Desktop grid (12 columns).
- **Gap**: Consistent `gap-6` or `gap-8`.
