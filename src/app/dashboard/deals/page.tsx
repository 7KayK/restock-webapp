import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tag } from 'lucide-react'

export default function DealsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Deals & Sales</h1>
        <p className="text-muted-foreground">
          Discounts on items you regularly buy, from nearby stores.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Available Deals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Badge variant="outline">No deals found</Badge>
            <p className="text-sm">
              Add your location and purchase history to see relevant deals.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
