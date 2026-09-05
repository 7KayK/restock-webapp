'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { Users, Plus, Loader2, Crown, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { TeamSummary } from '@/types'

export default function TeamsPage() {
  const { user } = useUser()
  const userEmail = user?.primaryEmailAddress?.emailAddress

  const [teams, setTeams]     = useState<TeamSummary[]>([])
  const [loading, setLoading] = useState(true)

  const [creating, setCreating]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [saving, setSaving]       = useState(false)
  const [createErr, setCreateErr] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/teams')
      .then((r) => r.json())
      .then((json) => { if (json.data) setTeams(json.data) })
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!newName.trim()) return
    setSaving(true)
    setCreateErr(null)
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create team')
      setTeams((prev) => [json.data, ...prev])
      setCreating(false)
      setNewName('')
    } catch (err) {
      setCreateErr(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-medium text-[#132B22] [font-family:var(--font-playfair)]">Teams</h1>
          <p className="text-sm text-[#132B22]/50 mt-0.5">
            Collaborate with household members on shared purchases
          </p>
        </div>
        <Button
          className="bg-[#132B22] hover:bg-[#132B22]/90 text-white gap-2 min-h-[44px] self-start sm:self-auto"
          onClick={() => setCreating(true)}
        >
          <Plus className="h-4 w-4" />
          Create team
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-[#132B22]" />
        </div>
      ) : teams.length === 0 ? (
        <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="rounded-full bg-[#132B22]/8 p-6">
              <Users className="h-10 w-10 text-[#132B22]/60" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-base font-semibold text-[#132B22]">No teams yet</p>
              <p className="text-sm text-[#132B22]/50 max-w-xs">
                Create a team to share purchases and track household inventory together.
              </p>
            </div>
            <Button
              className="bg-[#132B22] hover:bg-[#132B22]/90 text-white gap-2"
              onClick={() => setCreating(true)}
            >
              <Plus className="h-4 w-4" />
              Create your first team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {teams.map((team) => {
            const isOwner = team.owner.email === userEmail
            return (
              <Link key={team.id} href={`/dashboard/teams/${team.id}`}>
                <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-none hover:border-[#132B22]/30 hover:shadow-sm transition-all cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-[#132B22] truncate">{team.name}</p>
                          {isOwner && (
                            <Badge className="bg-[#132B22]/10 text-[#132B22] border-0 text-[10px] px-1.5 py-0 h-4">
                              <Crown className="h-2.5 w-2.5 mr-1" />
                              Owner
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-[#132B22]/45">
                          {team._count.members} {team._count.members === 1 ? 'member' : 'members'} · Created {formatDate(team.createdAt)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#132B22]/25 group-hover:text-[#132B22] shrink-0 mt-0.5 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Create team dialog */}
      <Dialog open={creating} onOpenChange={(o) => { setCreating(o); if (!o) { setNewName(''); setCreateErr(null) } }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#132B22]">Create a team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="team-name">Team name</Label>
              <Input
                id="team-name"
                placeholder="e.g. Household, Family, Roommates"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newName.trim()) handleCreate() }}
                autoFocus
              />
            </div>
            {createErr && (
              <p className="text-sm text-[#EF4444]">{createErr}</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setCreating(false); setNewName(''); setCreateErr(null) }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#132B22] hover:bg-[#132B22]/90 text-white"
                onClick={handleCreate}
                disabled={!newName.trim() || saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
