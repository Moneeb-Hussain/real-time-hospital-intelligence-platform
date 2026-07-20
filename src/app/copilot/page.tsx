import { ComingSoon } from '@/components/shared'

export default function CopilotPage() {
  return (
    <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full gap-6 h-full">
      <div className="flex-1 flex items-center justify-center">
        <ComingSoon feature="Copilot Fullscreen" description="Please use the slide-out panel on the main Dashboard to interact with the AI Copilot." />
      </div>
    </div>
  )
}
