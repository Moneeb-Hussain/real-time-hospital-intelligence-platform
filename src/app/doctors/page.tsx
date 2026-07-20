import { ComingSoon } from '@/components/shared'

export default function DoctorsPage() {
  return (
    <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full gap-6 h-full">
      <div className="flex-1 flex items-center justify-center">
        <ComingSoon feature="Shift Schedule" description="The staff shift scheduling and management tools are currently in development." />
      </div>
    </div>
  )
}
