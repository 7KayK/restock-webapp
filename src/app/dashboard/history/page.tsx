import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Purchase History</h1>
        <p className="text-muted-foreground">All your logged purchases.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Badge variant="outline">No purchases yet</Badge>
            <p className="text-sm">Use the AI assistant or add purchases manually.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
