import { StoreMap } from '@/components/shared/StoreMap'

export default function StoresPage() {
  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-[#132B22]">Nearest Store</h1>
        <p className="text-sm text-[#132B22]/50 mt-0.5">
          Grocery stores near you — click a marker for details
        </p>
      </div>

      <div className="flex flex-1 min-h-0" style={{ minHeight: '500px' }}>
        <StoreMap />
      </div>
    </div>
  )
}
