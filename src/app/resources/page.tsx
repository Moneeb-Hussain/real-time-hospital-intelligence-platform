import { ComingSoon } from '@/components/shared'

export default function ResourcesPage() {
  return (
    <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full gap-6 h-full">
      <div className="flex-1 flex items-center justify-center">
        <ComingSoon feature="Resource Management" description="The detailed resource and inventory management console is currently in development." />
      </div>
    </div>
  )
}
