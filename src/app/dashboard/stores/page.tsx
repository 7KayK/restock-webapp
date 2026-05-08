import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Store } from 'lucide-react'

export default function StoresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nearby Stores</h1>
        <p className="text-muted-foreground">Grocery stores near your location.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Stores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Badge variant="outline">Location not set</Badge>
            <p className="text-sm">Enable location access in settings to find nearby stores.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
