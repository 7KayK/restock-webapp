'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { CheckCircle2, MessageCircle, Phone, User, Loader2, AlertCircle, CalendarDays } from 'lucide-react'
import { WhatsAppIcon, TelegramIcon } from '@/components/shared/ChannelIcons'
import { formatDate } from '@/lib/utils'
import type { UserSettings, ChannelStatus, Integration } from '@/types'

const TELEGRAM_BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const [telegramInput, setTelegramInput] = useState('')
  const [whatsappInput, setWhatsappInput] = useState('')

  const [telegramSaving, setTelegramSaving] = useState(false)
  const [whatsappSaving, setWhatsappSaving] = useState(false)

  const [telegramMsg, setTelegramMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [whatsappMsg, setWhatsappMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const [channelData, setChannelData] = useState<Pick<ChannelStatus, 'telegramLastAt' | 'whatsappLastAt'> | null>(null)

  const [calIntegration, setCalIntegration] = useState<Integration | null>(null)
  const [calLoading, setCalLoading]         = useState(true)
  const [autoCalendar, setAutoCalendar]     = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('restock_auto_calendar') === 'true'
    }
    return false
  })

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((json) => { if (json.data) setSettings(json.data) })
      .finally(() => setLoading(false))

    fetch('/api/channels')
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setChannelData({
            telegramLastAt: json.data.telegramLastAt,
            whatsappLastAt: json.data.whatsappLastAt,
          })
        }
      })
      .catch(() => {})

    fetch('/api/integrations')
      .then((r) => r.json())
      .then((json) => {
        const cal = json.data?.find((i: Integration) => i.provider === 'google_calendar') ?? null
        setCalIntegration(cal)
      })
      .finally(() => setCalLoading(false))
  }, [])

  async function disconnectCalendar() {
    const res = await fetch('/api/integrations?provider=google_calendar', { method: 'DELETE' })
    if (res.ok) setCalIntegration(null)
  }

  function toggleAutoCalendar(checked: boolean) {
    setAutoCalendar(checked)
    localStorage.setItem('restock_auto_calendar', String(checked))
  }

  // Show success/error from OAuth callback redirect
  const [oauthMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(() => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'calendar_connected') return { type: 'success', text: 'Google Calendar connected!' }
    if (params.get('error') === 'calendar_denied') return { type: 'error', text: 'Calendar connection was cancelled.' }
    if (params.get('error') === 'calendar_failed') return { type: 'error', text: 'Failed to connect Google Calendar. Please try again.' }
    if (params.get('error') === 'calendar_not_configured') return { type: 'error', text: 'Google Calendar is not configured yet.' }
    return null
  })

  async function patchSettings(body: Record<string, unknown>) {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json() as { data?: UserSettings; error?: string }
    if (!res.ok) throw new Error(json.error ?? 'Failed to save')
    return json.data!
  }

  async function connectTelegram() {
    setTelegramMsg(null)
    setTelegramSaving(true)
    try {
      const updated = await patchSettings({ telegramId: telegramInput.trim() })
      setSettings(updated)
      setTelegramInput('')
      setTelegramMsg({ type: 'success', text: 'Telegram linked successfully' })
    } catch (err) {
      setTelegramMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' })
    } finally {
      setTelegramSaving(false)
    }
  }

  async function disconnectTelegram() {
    setTelegramMsg(null)
    setTelegramSaving(true)
    try {
      const updated = await patchSettings({ telegramId: null })
      setSettings(updated)
      setTelegramMsg({ type: 'success', text: 'Telegram disconnected' })
    } catch (err) {
      setTelegramMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to disconnect' })
    } finally {
      setTelegramSaving(false)
    }
  }

  async function connectWhatsApp() {
    setWhatsappMsg(null)
    setWhatsappSaving(true)
    try {
      const updated = await patchSettings({ whatsappNumber: whatsappInput.trim() })
      setSettings(updated)
      setWhatsappInput('')
      setWhatsappMsg({ type: 'success', text: 'WhatsApp linked successfully' })
    } catch (err) {
      setWhatsappMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' })
    } finally {
      setWhatsappSaving(false)
    }
  }

  async function disconnectWhatsApp() {
    setWhatsappMsg(null)
    setWhatsappSaving(true)
    try {
      const updated = await patchSettings({ whatsappNumber: null })
      setSettings(updated)
      setWhatsappMsg({ type: 'success', text: 'WhatsApp disconnected' })
    } catch (err) {
      setWhatsappMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to disconnect' })
    } finally {
      setWhatsappSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-[#0F7B6C]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and bot connections.</p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#0F7B6C]" />
            <CardTitle className="text-base">Account</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium text-[#1B3A5C]">{settings?.email ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Member since</span>
            <span className="font-medium text-[#1B3A5C]">
              {settings?.createdAt
                ? new Date(settings.createdAt).toLocaleDateString('en-CA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '—'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Telegram */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#0F7B6C]" />
              <CardTitle className="text-base">Telegram</CardTitle>
            </div>
            {settings?.telegramId ? (
              <Badge className="bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 hover:bg-[#22C55E]/10">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">Not connected</Badge>
            )}
          </div>
          <CardDescription>Receive restock reminders and log purchases via Telegram.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.telegramId ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Chat ID</span>
                <span className="font-mono font-medium text-[#1B3A5C]">{settings.telegramId}</span>
              </div>
              {channelData?.telegramLastAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last activity</span>
                  <span className="text-[#1B3A5C]/70">{formatDate(channelData.telegramLastAt)}</span>
                </div>
              )}
              {TELEGRAM_BOT && (
                <Button asChild className="w-full bg-[#229ED9] hover:bg-[#229ED9]/90 text-white">
                  <a href={`https://t.me/${TELEGRAM_BOT}`} target="_blank" rel="noopener noreferrer">
                    <TelegramIcon size={16} className="mr-2" />
                    Open in Telegram
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={disconnectTelegram}
                disabled={telegramSaving}
                className="text-[#EF4444] border-[#EF4444]/30 hover:bg-[#EF4444]/5 hover:text-[#EF4444]"
              >
                {telegramSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Disconnect Telegram
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg bg-[#0F7B6C]/5 border border-[#0F7B6C]/10 p-3 text-sm space-y-2">
                <p className="font-medium text-[#1B3A5C]">How to find your Chat ID</p>
                <ol className="list-decimal list-inside space-y-1 text-[#1B3A5C]/70">
                  <li>Open Telegram and message <span className="font-mono">@userinfobot</span></li>
                  <li>It replies with your numeric Chat ID</li>
                  <li>Paste it below and click Connect</li>
                </ol>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegram-id">Your Telegram Chat ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="telegram-id"
                    placeholder="e.g. 123456789"
                    value={telegramInput}
                    onChange={(e) => setTelegramInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && telegramInput.trim()) connectTelegram() }}
                  />
                  <Button
                    onClick={connectTelegram}
                    disabled={!telegramInput.trim() || telegramSaving}
                    className="bg-[#0F7B6C] hover:bg-[#0F7B6C]/90 shrink-0"
                  >
                    {telegramSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect'}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <StatusMessage msg={telegramMsg} />
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-[#0F7B6C]" />
              <CardTitle className="text-base">WhatsApp</CardTitle>
            </div>
            {settings?.whatsappNumber ? (
              <Badge className="bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 hover:bg-[#22C55E]/10">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">Not connected</Badge>
            )}
          </div>
          <CardDescription>Log purchases and receive reminders on WhatsApp.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.whatsappNumber ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Number</span>
                <span className="font-mono font-medium text-[#1B3A5C]">{settings.whatsappNumber}</span>
              </div>
              {channelData?.whatsappLastAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last activity</span>
                  <span className="text-[#1B3A5C]/70">{formatDate(channelData.whatsappLastAt)}</span>
                </div>
              )}
              {WHATSAPP_PHONE && (
                <Button asChild className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white">
                  <a href={`https://wa.me/${WHATSAPP_PHONE}`} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon size={16} className="mr-2" />
                    Open in WhatsApp
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={disconnectWhatsApp}
                disabled={whatsappSaving}
                className="text-[#EF4444] border-[#EF4444]/30 hover:bg-[#EF4444]/5 hover:text-[#EF4444]"
              >
                {whatsappSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Disconnect WhatsApp
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg bg-[#0F7B6C]/5 border border-[#0F7B6C]/10 p-3 text-sm space-y-2">
                <p className="font-medium text-[#1B3A5C]">How to link your number</p>
                <ol className="list-decimal list-inside space-y-1 text-[#1B3A5C]/70">
                  <li>Enter your number in E.164 format</li>
                  <li>Example: <span className="font-mono">+15551234567</span></li>
                  <li>The bot will recognise you on your next message</li>
                </ol>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp-number">WhatsApp Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="whatsapp-number"
                    placeholder="+15551234567"
                    type="tel"
                    value={whatsappInput}
                    onChange={(e) => setWhatsappInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && whatsappInput.trim()) connectWhatsApp() }}
                  />
                  <Button
                    onClick={connectWhatsApp}
                    disabled={!whatsappInput.trim() || whatsappSaving}
                    className="bg-[#0F7B6C] hover:bg-[#0F7B6C]/90 shrink-0"
                  >
                    {whatsappSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect'}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <StatusMessage msg={whatsappMsg} />
        </CardContent>
      </Card>

      {/* Google Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#0F7B6C]" />
              <CardTitle className="text-base">Google Calendar</CardTitle>
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
            Add shopping trips and restock reminders to your Google Calendar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {calLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#0F7B6C]" />
          ) : calIntegration ? (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Connected since</span>
                <span className="text-[#1B3A5C]/70">
                  {new Date(calIntegration.connectedAt).toLocaleDateString('en-CA', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div>
                  <p className="text-sm font-medium text-[#1B3A5C]">Auto-create events for reminders</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatically add a calendar event when a restock reminder is due
                  </p>
                </div>
                <Switch
                  checked={autoCalendar}
                  onCheckedChange={toggleAutoCalendar}
                />
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
            <div className="space-y-3">
              <p className="text-sm text-[#1B3A5C]/70">
                Connect your Google Calendar to schedule shopping trips and get reminder events automatically.
              </p>
              <Button asChild className="bg-[#0F7B6C] hover:bg-[#0F7B6C]/90 text-white gap-2">
                <a href="/api/auth/google-calendar">
                  <CalendarDays className="h-4 w-4" />
                  Connect Google Calendar
                </a>
              </Button>
            </div>
          )}
          {oauthMsg && (
            <p className={`flex items-center gap-1.5 text-sm ${oauthMsg.type === 'error' ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
              {oauthMsg.type === 'error'
                ? <AlertCircle className="h-4 w-4 shrink-0" />
                : <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {oauthMsg.text}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatusMessage({ msg }: { msg: { type: 'error' | 'success'; text: string } | null }) {
  if (!msg) return null
  return (
    <p className={`flex items-center gap-1.5 text-sm ${msg.type === 'error' ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
      {msg.type === 'error'
        ? <AlertCircle className="h-4 w-4 shrink-0" />
        : <CheckCircle2 className="h-4 w-4 shrink-0" />}
      {msg.text}
    </p>
  )
}
