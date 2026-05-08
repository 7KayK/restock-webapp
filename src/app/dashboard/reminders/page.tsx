import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'

export default function RemindersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Restock Reminders</h1>
        <p className="text-muted-foreground">
          AI-predicted dates for when you&apos;ll run out of items.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Active Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Badge variant="outline">No reminders yet</Badge>
            <p className="text-sm">
              Log at least 2 purchases of the same item to generate predictions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
