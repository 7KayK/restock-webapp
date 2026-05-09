import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SpendPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Spend Analytics</h1>
        <p className="text-muted-foreground">Track your spending over time.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spend</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Chart will appear once you log purchases.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Chart will appear once you log purchases.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
