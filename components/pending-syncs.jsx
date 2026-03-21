"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Trash2, Database } from "lucide-react"

export function PendingSyncs({ items, onRemove, onSync }) {
  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Pending Syncs</h2>
        <Badge variant="secondary">{items.length} items</Badge>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Database className="h-12 w-12 mb-4 opacity-20" />
            <p>No data waiting to be synced</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Batch: {item.batch} • Qty: {item.quantity}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground mt-1">{item.barcode}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onRemove(item.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}

          <Button className="w-full mt-4 h-12 text-lg" onClick={onSync}>
            <Check className="mr-2 h-5 w-5" />
            Sync All to Database
          </Button>
        </>
      )}
    </div>
  )
}
