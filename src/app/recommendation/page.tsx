import { ComingSoon } from '@/components/shared'

export default function RecommendationPage() {
  return (
    <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full gap-6 h-full">
      <div className="flex-1 flex items-center justify-center">
        <ComingSoon feature="AI Recommendations" description="The dedicated AI recommendations review queue is currently in development." />
      </div>
    </div>
  )
}
