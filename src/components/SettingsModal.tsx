import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

interface Props {
  open: boolean
  webhookUrl: string
  sertakanTechStack: boolean
  sertakanKode: boolean
  onSave: (url: string) => void
  onToggleTechStack: (v: boolean) => void
  onToggleKode: (v: boolean) => void
  onClose: () => void
}

export function SettingsModal({ open, webhookUrl, sertakanTechStack, sertakanKode, onSave, onToggleTechStack, onToggleKode, onClose }: Props) {
  const [value, setValue] = useState(webhookUrl)

  useEffect(() => { setValue(webhookUrl) }, [webhookUrl, open])

  function handleSave() {
    onSave(value.trim())
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pengaturan</DialogTitle>
          <DialogDescription>Atur URL webhook N8N dan preferensi PRD.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="webhook-url">N8N Webhook Base URL</Label>
          <Input
            id="webhook-url"
            type="url"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="https://your-n8n.domain/webhook/"
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          <p className="text-xs text-muted-foreground">
            Masukkan URL webhook N8N kamu sampai <code className="text-foreground">/webhook/</code>. Aplikasi otomatis menambahkan <code className="text-foreground">prd-analyze</code> dan <code className="text-foreground">prd-generate</code>. Webhook harus mengembalikan JSON dengan field <code className="text-foreground">prd_files</code>.
          </p>
        </div>

        <Separator />

        <div className="grid gap-3">
          <p className="text-sm font-medium text-foreground">Preferensi PRD</p>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="pref-stack" className="text-sm font-medium">Sertakan tech stack</Label>
              <p className="text-xs text-muted-foreground">Jika mati, PRD tidak menyebut tech stack / teknologi spesifik.</p>
            </div>
            <Switch id="pref-stack" checked={sertakanTechStack} onCheckedChange={onToggleTechStack} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="pref-kode" className="text-sm font-medium">Sertakan kode / coding</Label>
              <p className="text-xs text-muted-foreground">Jika mati, PRD tidak memuat snippet kode / source code.</p>
            </div>
            <Switch id="pref-kode" checked={sertakanKode} onCheckedChange={onToggleKode} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
