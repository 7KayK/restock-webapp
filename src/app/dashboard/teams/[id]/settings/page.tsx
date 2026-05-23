'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import {
  ArrowLeft, Loader2, CheckCircle2, AlertCircle,
  CalendarDays, CreditCard, Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { TeamDetail, Integration } from '@/types'

export default function TeamSettingsPage() {
  const { id } = useParams() as { id: string }
  const router  = useRouter()
  const { user } = useUser()
  const userEmail = user?.primaryEmailAddress?.emailAddress

  const [team, setTeam]     = useState<TeamDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const [nameInput, setNameInput]   = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameMsg, setNameMsg]       = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const [calIntegration, setCalIntegration] = useState<Integration | null>(null)
  const [calLoading, setCalLoading]         = useState(true)

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting]           = useState(false)
  const [deleteErr, setDeleteErr]         = useState<string | null>(null)

  const isOwner = team ? team.owner.email === userEmail : false

  useEffect(() => {
    fetch(`/api/teams/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setTeam(json.data)
          setNameInput(json.data.name)
        }
      })
      .finally(() => setLoading(false))

    fetch('/api/integrations')
      .then((r) => r.json())
      .then((json) => {
        const cal = json.data?.find((i: Integration) => i.provider === 'google_calendar') ?? null
        setCalIntegration(cal)
      })
      .finally(() => setCalLoading(false))
  }, [id])

  async function saveName() {
    if (!nameInput.trim() || nameInput === team?.name) return
    setNameSaving(true)
    setNameMsg(null)
    try {
      const res = await fetch(`/api/teams/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to save')
      setTeam((prev) => prev ? { ...prev, name: json.data.name } : prev)
      setNameMsg({ type: 'success', text: 'Team name updated' })
    } catch (err) {
      setNameMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' })
    } finally {
      setNameSaving(false)
    }
  }

  async function disconnectCalendar() {
    const res = await fetch('/api/integrations?provider=google_calendar', { method: 'DELETE' })
    if (res.ok) setCalIntegration(null)
  }

  async function deleteTeam() {
    setDeleting(true)
    setDeleteErr(null)
    try {
      const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to delete team')
      router.push('/dashboard/teams')
    } catch (err) {
      setDeleteErr(err instanceof Error ? err.message : 'Failed to delete team')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-[#0F7B6C]" />
      </div>
    )
  }

  if (!team || !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <AlertCircle className="h-6 w-6 text-[#EF4444]" />
        <p className="text-sm text-[#1B3A5C]/60">
          {!team ? 'Team not found' : 'Only the team owner can access settings'}
        </p>
        <Link href={`/dashboard/teams/${id}`}>
          <Button variant="outline" size="sm">Back to team</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/teams/${id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1B3A5C]/50">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Team Settings</h1>
          <p className="text-sm text-[#1B3A5C]/50 mt-0.5">{team.name}</p>
        </div>
      </div>

      {/* Team name */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team name</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="team-name">Name</Label>
            <div className="flex gap-2">
              <Input
                id="team-name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName() }}
                className="text-[#1B3A5C]"
              />
              <Button
                size="sm"
                className="bg-[#0F7B6C] hover:bg-[#0F7B6C]/90 text-white shrink-0"
                onClick={saveName}
                disabled={!nameInput.trim() || nameInput === team.name || nameSaving}
              >
                {nameSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
          {nameMsg && (
            <p className={`flex items-center gap-1.5 text-sm ${nameMsg.type === 'error' ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
              {nameMsg.type === 'error'
                ? <AlertCircle className="h-4 w-4" />
                : <CheckCircle2 className="h-4 w-4" />}
              {nameMsg.text}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Google Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#0F7B6C]" />
              <CardTitle className="text-base">Shared Google Calendar</CardTitle>
            </div>
            {!calLoading && (
              calIntegration ? (
                <Badge className="bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 hover:bg-[#22C55E]/10">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">Not connected</Badge>
              )
            )}
          </div>
          <CardDescription>
            Team calendar events will be created on your Google Calendar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {calLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#0F7B6C]" />
          ) : calIntegration ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Connected since</span>
                <span className="text-[#1B3A5C]/70">
                  {new Date(calIntegration.connectedAt).toLocaleDateString('en-CA', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnectCalendar}
                className="text-[#EF4444] border-[#EF4444]/30 hover:bg-[#EF4444]/5 hover:text-[#EF4444]"
              >
                Disconnect Calendar
              </Button>
            </div>
          ) : (
            <Button asChild className="bg-[#0F7B6C] hover:bg-[#0F7B6C]/90 text-white gap-2">
              <a href="/api/auth/google-calendar">
                <CalendarDays className="h-4 w-4" />
                Connect Google Calendar
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Billing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#0F7B6C]" />
            <CardTitle className="text-base">Billing</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-[#0F7B6C]/5 border border-[#0F7B6C]/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium text-[#1B3A5C]">Teams plan</p>
              <Badge className="bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/20">
                Coming soon
              </Badge>
            </div>
            <p className="text-2xl font-bold text-[#1B3A5C]">
              $30<span className="text-sm font-normal text-[#1B3A5C]/50">/month per team</span>
            </p>
            <ul className="text-sm text-[#1B3A5C]/60 space-y-1">
              <li>· Unlimited team members</li>
              <li>· Shared inventory tracking</li>
              <li>· Google Calendar sync</li>
              <li>· Team purchase history</li>
            </ul>
          </div>
          <Button disabled className="w-full" variant="outline">
            Upgrade — coming soon
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-[#EF4444]/20">
        <CardHeader>
          <CardTitle className="text-base text-[#EF4444]">Danger zone</CardTitle>
          <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-[#1B3A5C]">Delete team</p>
              <p className="text-xs text-[#1B3A5C]/50 mt-0.5">
                Removes all members. Existing purchases are kept in personal history.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-[#EF4444] border-[#EF4444]/30 hover:bg-[#EF4444]/5 hover:text-[#EF4444] shrink-0 ml-4"
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete team
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#EF4444]">Delete team?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-[#1B3A5C]/70">
              This will permanently delete <strong>{team.name}</strong> and remove all members.
              Existing purchases will remain in each member's personal history.
            </p>
            {deleteErr && (
              <p className="text-sm text-[#EF4444]">{deleteErr}</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#EF4444] hover:bg-[#EF4444]/90 text-white"
                onClick={deleteTeam}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete team'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
