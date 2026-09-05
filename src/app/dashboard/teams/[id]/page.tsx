'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import {
  Settings, Loader2, Camera, Trash2,
  AlertCircle, PackageSearch, ShoppingBag, Users,
  Crown, UserMinus, Plus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency, formatDate, formatRelativeDate } from '@/lib/utils'
import { ImageIntelligence } from '@/components/shared/ImageIntelligence'
import type { TeamDetail, TeamPurchase, TeamInventory, Purchase } from '@/types'

type Tab = 'inventory' | 'purchases' | 'members'

const SOURCE_STYLES: Record<string, string> = {
  telegram: 'bg-blue-50 text-blue-600',
  whatsapp: 'bg-green-50 text-green-700',
  image:    'bg-teal-50 text-[#132B22]',
  manual:   'bg-[#EFE7D6] text-[#5b6a5d]',
}

function initials(email: string) {
  return email.slice(0, 2).toUpperCase()
}

export default function TeamDetailPage() {
  const { id } = useParams() as { id: string }
  const { user } = useUser()
  const userEmail = user?.primaryEmailAddress?.emailAddress

  const [tab, setTab]           = useState<Tab>('inventory')
  const [team, setTeam]         = useState<TeamDetail | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const [inventory, setInventory]     = useState<TeamInventory | null>(null)
  const [inventoryLoading, setInventoryLoading] = useState(false)

  const [purchases, setPurchases]     = useState<TeamPurchase[]>([])
  const [purchasesLoading, setPurchasesLoading] = useState(false)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting]       = useState(false)
  const [inviteMsg, setInviteMsg]     = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const [removingId, setRemovingId]   = useState<string | null>(null)

  const [scanOpen, setScanOpen] = useState(false)

  const isOwner = team ? team.owner.email === userEmail : false

  // Load team
  useEffect(() => {
    fetch(`/api/teams/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setTeam(json.data)
        else setError(json.error ?? 'Team not found')
      })
      .catch(() => setError('Failed to load team'))
      .finally(() => setLoading(false))
  }, [id])

  // Load inventory
  const loadInventory = useCallback(() => {
    setInventoryLoading(true)
    fetch(`/api/teams/${id}/inventory`)
      .then((r) => r.json())
      .then((json) => { if (json.data) setInventory(json.data) })
      .finally(() => setInventoryLoading(false))
  }, [id])

  // Load purchases
  const loadPurchases = useCallback(() => {
    setPurchasesLoading(true)
    fetch(`/api/teams/${id}/purchases`)
      .then((r) => r.json())
      .then((json) => { if (json.data) setPurchases(json.data) })
      .finally(() => setPurchasesLoading(false))
  }, [id])

  useEffect(() => {
    if (tab === 'inventory' && !inventory) loadInventory()
    if (tab === 'purchases' && purchases.length === 0) loadPurchases()
  }, [tab, inventory, purchases.length, loadInventory, loadPurchases])

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteMsg(null)
    try {
      const res = await fetch(`/api/teams/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to add member')
      setTeam((prev) => prev ? { ...prev, members: [...prev.members, json.data] } : prev)
      setInviteEmail('')
      setInviteMsg({ type: 'success', text: `${inviteEmail.trim()} added to the team` })
    } catch (err) {
      setInviteMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to add member' })
    } finally {
      setInviting(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    setRemovingId(memberId)
    try {
      const res = await fetch(`/api/teams/${id}/members/${memberId}`, { method: 'DELETE' })
      if (res.ok) {
        setTeam((prev) => prev
          ? { ...prev, members: prev.members.filter((m) => m.id !== memberId) }
          : prev)
      }
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-[#132B22]" />
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="flex items-center justify-center h-48 gap-2 text-[#EF4444]">
        <AlertCircle className="h-5 w-5" />
        <span className="text-sm">{error ?? 'Team not found'}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-medium text-[#132B22] [font-family:var(--font-playfair)]">{team.name}</h1>
            {isOwner && (
              <Badge className="bg-[#132B22]/10 text-[#132B22] border-0 text-[10px] px-1.5">
                <Crown className="h-2.5 w-2.5 mr-1" />
                Owner
              </Badge>
            )}
          </div>
          <p className="text-sm text-[#132B22]/50 mt-0.5">
            {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        {isOwner && (
          <Link href={`/dashboard/teams/${id}/settings`}>
            <Button variant="outline" size="sm" className="gap-2 text-[#132B22]/60 border-[rgba(19,43,34,0.18)]">
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Button>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[rgba(19,43,34,0.10)]">
        {(['inventory', 'purchases', 'members'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors',
              tab === t
                ? 'text-[#132B22] border-[#132B22]'
                : 'text-[#132B22]/50 border-transparent hover:text-[#132B22]'
            )}
          >
            {t === 'inventory'  && <PackageSearch className="h-3.5 w-3.5" />}
            {t === 'purchases'  && <ShoppingBag className="h-3.5 w-3.5" />}
            {t === 'members'    && <Users className="h-3.5 w-3.5" />}
            {t}
          </button>
        ))}
      </div>

      {/* ── Inventory tab ── */}
      {tab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              className="bg-[#132B22] hover:bg-[#132B22]/90 text-white gap-2"
              onClick={() => setScanOpen(true)}
            >
              <Camera className="h-3.5 w-3.5" />
              Scan Inventory
            </Button>
          </div>

          {inventoryLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#132B22]" />
            </div>
          ) : !inventory || (inventory.out.length === 0 && inventory.low.length === 0 && inventory.ok.length === 0) ? (
            <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-none">
              <CardContent className="flex flex-col items-center py-16 gap-3">
                <PackageSearch className="h-10 w-10 text-[#132B22]/20" />
                <p className="text-sm text-[#132B22]/45 text-center max-w-xs">
                  No inventory data yet. Scan a pantry photo or start logging team purchases.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {inventory.out.length > 0 && (
                <InventorySection
                  title="Out of stock"
                  color="text-[#EF4444]"
                  bg="bg-[#EF4444]/8"
                  dot="bg-[#EF4444]"
                  items={inventory.out}
                  label={(e) => `Overdue since ${formatRelativeDate(e.dueDate!)}`}
                />
              )}
              {inventory.low.length > 0 && (
                <InventorySection
                  title="Running low"
                  color="text-[#C9A15A]"
                  bg="bg-[#C9A15A]/8"
                  dot="bg-[#C9A15A]"
                  items={inventory.low}
                  label={(e) => `Due ${formatRelativeDate(e.dueDate!)}`}
                />
              )}
              {inventory.ok.length > 0 && (
                <InventorySection
                  title="In stock"
                  color="text-[#22C55E]"
                  bg="bg-[#22C55E]/8"
                  dot="bg-[#22C55E]"
                  items={inventory.ok}
                  label={(e) => `Last bought ${formatRelativeDate(e.lastPurchased!)}`}
                />
              )}
            </div>
          )}

          <ImageIntelligence
            open={scanOpen}
            onOpenChange={setScanOpen}
            mode="inventory"
            defaultTeamId={id}
            onImport={() => loadInventory()}
          />
        </div>
      )}

      {/* ── Purchases tab ── */}
      {tab === 'purchases' && (
        <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#132B22]">Team Purchases</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {purchasesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#132B22]" />
              </div>
            ) : purchases.length === 0 ? (
              <p className="text-sm text-center text-[#132B22]/40 py-12">
                No team purchases yet
              </p>
            ) : (
              <ul className="divide-y divide-[rgba(19,43,34,0.08)]">
                {purchases.map((p) => {
                  const sourceStyle = SOURCE_STYLES[p.source] ?? SOURCE_STYLES.manual
                  return (
                    <li key={p.id} className="flex items-center gap-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-[#132B22]">{p.item}</span>
                          <span className="text-sm text-[#132B22]/50">
                            × {p.quantity}{p.unit ? ` ${p.unit}` : ''}
                          </span>
                          {p.source === 'image' && <Camera className="h-3 w-3 text-[#132B22]" />}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {p.category && (
                            <span className="rounded-full bg-[#132B22]/10 text-[#132B22] text-[10px] font-medium px-2 py-0.5">
                              {p.category}
                            </span>
                          )}
                          <span className={`rounded-full text-[10px] font-medium px-2 py-0.5 ${sourceStyle}`}>
                            {p.source}
                          </span>
                          <span className="text-[10px] text-[#132B22]/40">
                            by {p.user.email.split('@')[0]}
                          </span>
                          <span className="text-[#132B22]/35 text-xs">{formatDate(p.createdAt)}</span>
                        </div>
                      </div>
                      {p.price != null && (
                        <span className="text-sm font-semibold text-[#132B22] shrink-0">
                          {formatCurrency(p.price)}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Members tab ── */}
      {tab === 'members' && (
        <div className="space-y-4">
          <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-none">
            <CardContent className="p-0">
              <ul className="divide-y divide-[rgba(19,43,34,0.08)]">
                {team.members.map((m) => {
                  const isSelf  = m.user.email === userEmail
                  const canRemove = isOwner ? m.role !== 'owner' : isSelf && m.role !== 'owner'
                  return (
                    <li key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="h-8 w-8 rounded-full bg-[#132B22]/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[#132B22]">
                          {initials(m.user.email)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium text-[#132B22] truncate">
                            {m.user.email}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] text-[#132B22]/40">(you)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {m.role === 'owner' ? (
                            <Badge className="bg-[#132B22]/10 text-[#132B22] border-0 text-[10px] px-1.5 py-0 h-4">
                              <Crown className="h-2.5 w-2.5 mr-1" />
                              Owner
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-[#132B22]/50">
                              Member
                            </Badge>
                          )}
                          <span className="text-[10px] text-[#132B22]/35">
                            Joined {formatDate(m.joinedAt)}
                          </span>
                        </div>
                      </div>
                      {canRemove && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[#132B22]/30 hover:text-[#EF4444] hover:bg-[#EF4444]/10 shrink-0"
                          onClick={() => handleRemoveMember(m.id)}
                          disabled={removingId === m.id}
                          aria-label="Remove member"
                        >
                          {removingId === m.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <UserMinus className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>

          {/* Invite (owner only) */}
          {isOwner && (
            <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-[#132B22]">Invite by email</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <p className="text-xs text-[#132B22]/50">
                  The person must already have a Restock account.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="teammate@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && inviteEmail.trim()) handleInvite() }}
                    className="text-[#132B22] text-sm"
                  />
                  <Button
                    size="sm"
                    className="bg-[#132B22] hover:bg-[#132B22]/90 text-white gap-1.5 shrink-0"
                    onClick={handleInvite}
                    disabled={!inviteEmail.trim() || inviting}
                  >
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-3.5 w-3.5" /> Add</>}
                  </Button>
                </div>
                {inviteMsg && (
                  <p className={`text-sm ${inviteMsg.type === 'error' ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                    {inviteMsg.text}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

interface InventorySectionProps {
  title: string
  color: string
  bg: string
  dot: string
  items: { id: string; item: string; dueDate?: string; lastPurchased?: string }[]
  label: (entry: { id: string; item: string; dueDate?: string; lastPurchased?: string }) => string
}

function InventorySection({ title, color, bg, dot, items, label }: InventorySectionProps) {
  return (
    <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${dot}`} />
          <CardTitle className={`text-sm ${color}`}>{title}</CardTitle>
          <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${bg} ${color}`}>
            {items.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y divide-[rgba(19,43,34,0.08)]">
          {items.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between py-2.5">
              <span className="text-sm font-medium text-[#132B22] capitalize">{entry.item}</span>
              <span className="text-xs text-[#132B22]/40">{label(entry)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
