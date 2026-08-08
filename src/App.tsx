import { useState, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { Spinner } from '@/components/ui/spinner'
import { Settings, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import Lottie from 'lottie-react'
import { SettingsModal } from './components/SettingsModal'
import { StatusPanel, type TimelineStep } from './components/StatusPanel'
import { OutputPanel, type ResultData } from './components/OutputPanel'

const STORAGE_KEY = 'prd_webhook_url'
const FETCH_TIMEOUT_MS = 5 * 60 * 1000

const DESIGN_SYSTEMS = [
  { id: 'shadcn', label: 'shadcn/ui' },
  { id: 'material', label: 'Material UI' },
  { id: 'chakra', label: 'Chakra UI' },
  { id: 'cloudscape', label: 'AWS Cloudscape' },
  { id: 'porsche', label: 'Porsche' },
]

interface RisikoItem { resiko: string; dampak: string; mitigasi: string }
interface BiayaItem { komponen: string; keterangan: string; kira_kira: string }
interface AnalisisBiaya { ada_biaya: boolean; kesimpulan: string; rincian_biaya: BiayaItem[] }
interface AnalysisData {
  project_name?: string
  ide_inti?: string
  target_pengguna?: string
  problem_yang_diselesaikan?: string
  value_proposition?: string
  platform?: string
  fitur_inti?: string[]
  fitur_nice_to_have?: string[]
  complexity_level?: string
  estimasi_skala?: string
  resiko?: RisikoItem[]
  peluang?: string[]
  analisis_biaya?: AnalisisBiaya | null
}

const loadingLottie = {
  v: '5.7.4', fr: 30, ip: 0, op: 60, w: 200, h: 200, nm: 'loading', ddd: 0, assets: [],
  layers: [
    {
      ddd: 0, ind: 1, ty: 4, nm: 'ring1',
      ks: {
        o: { a: 1, k: [
          { t: 0, s: [0] }, { t: 8, s: [80] }, { t: 40, s: [0] }, { t: 60, s: [0] }
        ] },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [
          { t: 0, s: [20, 20, 100] }, { t: 40, s: [100, 100, 100] }, { t: 60, s: [100, 100, 100] }
        ] }
      },
      shapes: [
        { ty: 'el', d: 1, s: { a: 0, k: [60, 60] }, p: { a: 0, k: [0, 0] }, nm: 'ellipse' },
        { ty: 'st', c: { a: 0, k: [1, 1, 1, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 3 }, lc: 2, lj: 2, nm: 'stroke' }
      ]
    },
    {
      ddd: 0, ind: 2, ty: 4, nm: 'ring2',
      ks: {
        o: { a: 1, k: [
          { t: 0, s: [0] }, { t: 20, s: [0] }, { t: 28, s: [60] }, { t: 60, s: [0] }
        ] },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [
          { t: 0, s: [20, 20, 100] }, { t: 20, s: [20, 20, 100] }, { t: 60, s: [100, 100, 100] }
        ] }
      },
      shapes: [
        { ty: 'el', d: 1, s: { a: 0, k: [60, 60] }, p: { a: 0, k: [0, 0] }, nm: 'ellipse' },
        { ty: 'st', c: { a: 0, k: [0.55, 0.55, 0.55, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 2 }, lc: 2, lj: 2, nm: 'stroke' }
      ]
    },
    {
      ddd: 0, ind: 3, ty: 4, nm: 'dot',
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [
          { t: 0, s: [80, 80, 100] }, { t: 30, s: [110, 110, 100] }, { t: 60, s: [80, 80, 100] }
        ] }
      },
      shapes: [
        { ty: 'el', d: 1, s: { a: 0, k: [30, 30] }, p: { a: 0, k: [0, 0] }, nm: 'ellipse' },
        { ty: 'fl', c: { a: 0, k: [1, 1, 1, 1] }, o: { a: 0, k: 100 }, nm: 'fill' }
      ]
    }
  ]
}

type StepId = 'explore' | 'approval' | 'breakdown' | 'generate'
type Phase = 'idle' | 'analyzing' | 'approval' | 'generating' | 'done' | 'error'

function loadWebhookUrl(): string {
  try { return localStorage.getItem(STORAGE_KEY) ?? '' } catch { return '' }
}
function saveWebhookUrl(url: string) {
  try { localStorage.setItem(STORAGE_KEY, url) } catch { /* ignore */ }
}
const PREFS_KEY = 'prd_preferensi'
function loadPref(key: string, def: boolean): boolean {
  try {
    const v = localStorage.getItem(PREFS_KEY)
    if (!v) return def
    const o = JSON.parse(v)
    return typeof o[key] === 'boolean' ? o[key] : def
  } catch { return def }
}
function savePref(key: string, val: boolean) {
  try {
    const v = localStorage.getItem(PREFS_KEY)
    const o = v ? JSON.parse(v) : {}
    o[key] = val
    localStorage.setItem(PREFS_KEY, JSON.stringify(o))
  } catch { /* ignore */ }
}

function webhookBase(url: string): string {
  const m = url.match(/^(.*\/webhook\/)[^/]*$/i)
  return m ? m[1] : (url.endsWith('/') ? url : url + '/')
}

function formatError(err: unknown): string {
  const e = err as Error
  let msg = e.message ?? 'Terjadi kesalahan tidak diketahui.'
  if (e.name === 'AbortError') msg = 'Timeout: N8N tidak merespons dalam 5 menit. Cek execution logs di N8N.'
  else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) msg = 'Gagal terhubung ke webhook. Pastikan URL benar dan CORS diaktifkan di N8N.'
  return msg
}

export default function App() {
  const [webhookUrl, setWebhookUrl]     = useState<string>(loadWebhookUrl)
  const [ideInput, setIdeInput]         = useState('')
  const [designSystem, setDesignSystem] = useState<string>('shadcn')
  const [sertakanTechStack, setSertakanTechStack] = useState<boolean>(loadPref('sertakan_tech_stack', true))
  const [sertakanKode, setSertakanKode]           = useState<boolean>(loadPref('sertakan_kode', true))
  const [phase, setPhase]               = useState<Phase>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult]             = useState<ResultData | null>(null)
  const [analysis, setAnalysis]         = useState<AnalysisData | null>(null)
  const [feedback, setFeedback]         = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [elapsed, setElapsed]           = useState(0)
  const [currentStep, setCurrentStep]   = useState(-1)
  const [stepLogs, setStepLogs]         = useState<Record<StepId, string[]>>({
    explore: [], approval: [], breakdown: [], generate: [],
  })

  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  const addLog = useCallback((step: StepId, msg: string) => {
    const time = new Date().toLocaleTimeString('id-ID')
    setStepLogs(prev => ({
      ...prev,
      [step]: [...prev[step], `[${time}] ${msg}`],
    }))
  }, [])

  function clearStepTimers() {
    stepTimers.current.forEach(clearTimeout)
    stepTimers.current = []
  }

  function scheduleLogs(step: StepId, lines: string[], startMs: number, intervalMs: number) {
    lines.forEach((line, i) => {
      stepTimers.current.push(setTimeout(() => addLog(step, line), startMs + i * intervalMs))
    })
  }

  const isProcessing = phase === 'analyzing' || phase === 'generating'

  useEffect(() => {
    if (isProcessing) {
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  useEffect(() => () => clearStepTimers(), [])

  function getStepState(index: number): TimelineStep['state'] {
    if (phase === 'idle') return 'waiting'
    if (phase === 'done') return 'done'
    if (phase === 'error') {
      if (index < currentStep) return 'done'
      if (index === currentStep) return 'error'
      return 'waiting'
    }
    if (index < currentStep) return 'done'
    if (index === currentStep) return 'active'
    return 'waiting'
  }

  const steps: TimelineStep[] = [
    { id: 'explore',   label: 'Analisis Ide',       description: 'Memahami ide + menilai risiko, peluang & biaya', state: getStepState(0), logs: stepLogs.explore },
    { id: 'approval',  label: 'Persetujuan',        description: 'Konfirmasi pemahaman sebelum lanjut ke PRD',     state: getStepState(1), logs: stepLogs.approval },
    { id: 'breakdown', label: 'Breakdown Tahapan',  description: 'Memecah development menjadi tahapan terstruktur', state: getStepState(2), logs: stepLogs.breakdown },
    { id: 'generate',  label: 'Generate PRD',       description: 'Menulis PRD lengkap untuk setiap tahapan',        state: getStepState(3), logs: stepLogs.generate },
  ]

  const analyzeUrl  = webhookBase(webhookUrl) + 'prd-analyze'
  const generateUrl = webhookBase(webhookUrl) + 'prd-generate'
  const prefs       = { sertakan_tech_stack: sertakanTechStack, sertakan_kode: sertakanKode }

  function handleReset() {
    clearStepTimers()
    setPhase('idle')
    setResult(null)
    setAnalysis(null)
    setErrorMessage('')
    setFeedback('')
    setElapsed(0)
    setCurrentStep(-1)
    setStepLogs({ explore: [], approval: [], breakdown: [], generate: [] })
  }

  function handleReject() {
    clearStepTimers()
    setAnalysis(null)
    setFeedback('')
    setCurrentStep(-1)
    setStepLogs({ explore: [], approval: [], breakdown: [], generate: [] })
    setPhase('idle')
  }

  async function handleAnalyze() {
    if (!webhookUrl) { setShowSettings(true); return }
    if (!ideInput.trim()) return

    clearStepTimers()
    setPhase('analyzing')
    setResult(null)
    setAnalysis(null)
    setErrorMessage('')
    setElapsed(0)
    setCurrentStep(0)
    setStepLogs({ explore: [], approval: [], breakdown: [], generate: [] })

    addLog('explore', 'Mengirim ide ke N8N untuk dianalisis...')
    addLog('explore', 'Menganalisis inti ide, target user, dan value proposition...')
    scheduleLogs('explore', [
      'Mengidentifikasi problem & value proposition...',
      'Mengevaluasi risiko teknis, bisnis, dan pasar...',
      'Menilai peluang yang bisa dimaksimalkan...',
      'Menganalisis biaya pembangunan & lokasi cost...',
    ], 2400, 2600)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const response = await fetch(analyzeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ide: ideInput.trim(),
          preferensi: prefs,
          design_system: sertakanTechStack ? designSystem : '',
          feedback: feedback || undefined,
        }),
        signal: controller.signal,
      })

      clearTimeout(timer)

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)

      let data: unknown
      try { data = await response.json() }
      catch { throw new Error('Response dari N8N bukan JSON yang valid.') }

      const payload = (data as { data?: unknown }).data ?? data
      const ideResult = (payload as { ide_result?: unknown }).ide_result ?? payload

      clearStepTimers()
      setAnalysis(ideResult as AnalysisData)
      addLog('explore', 'Analisis selesai. Silakan periksa & setujui.')
      setCurrentStep(1)
      setPhase('approval')

    } catch (err: unknown) {
      clearTimeout(timer)
      clearStepTimers()
      const msg = formatError(err)
      setPhase('error')
      setErrorMessage(msg)
      addLog('explore', `Gagal: ${msg}`)
    }
  }

  async function handleGenerate() {
    if (!analysis) { setPhase('error'); setErrorMessage('Analisis belum tersedia.'); return }

    setPhase('generating')
    setErrorMessage('')
    setElapsed(0)
    setCurrentStep(2)

    addLog('approval', 'Analisis disetujui. Melanjutkan ke pembuatan PRD...')
    addLog('breakdown', 'Memecah development menjadi tahapan terstruktur...')
    scheduleLogs('breakdown', [
      'Mengurutkan tahapan dari fondasi teknis hingga launch...',
      'Menentukan estimasi durasi & tech focus tiap tahapan...',
    ], 2600, 2800)
    stepTimers.current.push(
      setTimeout(() => {
        setCurrentStep(3)
        addLog('breakdown', 'Tahapan terstruktur.')
        addLog('generate', 'Menulis PRD untuk setiap tahapan...')
        addLog('generate', 'Estimasi waktu: 1-3 menit tergantung kompleksitas')
      }, 6000),
    )

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const response = await fetch(generateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ide: ideInput.trim(),
          preferensi: prefs,
          design_system: sertakanTechStack ? designSystem : '',
          analisis: analysis,
        }),
        signal: controller.signal,
      })

      clearTimeout(timer)

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)

      let data: unknown
      try { data = await response.json() }
      catch { throw new Error('Response dari N8N bukan JSON yang valid.') }

      const payload = (data as { data?: unknown }).data ?? data
      const r = payload as ResultData

      if (!r || !Array.isArray(r.prd_files)) {
        throw new Error('Response dari N8N tidak valid. Cek workflow N8N kamu - pastikan field prd_files ada.')
      }

      clearStepTimers()
      setResult(r)
      setPhase('done')
      addLog('generate', `Selesai! ${r.total_tahapan} PRD berhasil dibuat.`)
      addLog('generate', `Project: ${r.project_name} (${r.complexity_level})`)

    } catch (err: unknown) {
      clearTimeout(timer)
      clearStepTimers()
      const msg = formatError(err)
      setPhase('error')
      setErrorMessage(msg)
      addLog('generate', `Gagal: ${msg}`)
    }
  }

  const isWebhookMissing = !webhookUrl
  const isDone    = phase === 'done'
  const isError   = phase === 'error'

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">

          {/* Header */}
          <header className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">PRD Generator</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Dari ide mentah jadi PRD siap pakai</p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setShowSettings(true)}>
                  <Settings size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pengaturan Webhook</TooltipContent>
            </Tooltip>
          </header>

          {/* Input Panel */}
          <Card className="gap-4">
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ide-input">Deskripsikan Idemu</Label>
                <Textarea
                  id="ide-input"
                  value={ideInput}
                  onChange={e => setIdeInput(e.target.value)}
                  placeholder="Deskripsikan ide aplikasimu di sini... (contoh: aplikasi manajemen inventaris untuk divisi RND dengan fitur approval workflow dan tracking stok real-time)"
                  disabled={isProcessing}
                  className="min-h-[120px] resize-none"
                  rows={5}
                />
              </div>

              {sertakanTechStack && (
                <div className="grid gap-2">
                  <Label>Design System</Label>
                  <Select value={designSystem} onValueChange={setDesignSystem} disabled={isProcessing}>
                    <SelectTrigger><SelectValue placeholder="Pilih design system" /></SelectTrigger>
                    <SelectContent>
                      {DESIGN_SYSTEMS.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Design system dipakai untuk menyusun PRD saat opsi tech stack aktif.
                  </p>
                </div>
              )}

              {isWebhookMissing && (
                <Alert>
                  <AlertTriangle size={16} />
                  <AlertTitle>Webhook URL belum diset</AlertTitle>
                  <AlertDescription>
                    Buka pengaturan untuk memasukkan URL webhook N8N kamu.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={isDone ? handleReset : handleAnalyze}
                disabled={isProcessing || !ideInput.trim()}
                size="lg"
                className="w-full"
              >
                {isProcessing ? (
                  <><Spinner className="size-4" /> Memproses... {elapsed > 0 && `(${elapsed}s)`}</>
                ) : isDone ? (
                  'Generate Ulang'
                ) : (
                  'Analisis Ide'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Lottie animation while processing */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-4">
              <Lottie animationData={loadingLottie} loop className="w-32 h-32" />
              <p className="text-sm text-muted-foreground mt-2">
                {phase === 'analyzing' ? 'Menganalisis ide secara mendalam di N8N...' : 'Menyusun PRD di N8N...'}
              </p>
            </div>
          )}

          {/* Approval section */}
          {phase === 'approval' && analysis && (
            <ApprovalCard
              analysis={analysis}
              designSystem={designSystem}
              sertakanTechStack={sertakanTechStack}
              sertakanKode={sertakanKode}
              feedback={feedback}
              setFeedback={setFeedback}
              onApprove={handleGenerate}
              onReject={handleReject}
            />
          )}

          {/* Status Panel - vertical timeline */}
          {phase !== 'idle' && (
            <StatusPanel status={phase} steps={steps} />
          )}

          {/* Error banner */}
          {isError && (
            <Alert variant="destructive">
              <AlertTriangle size={16} />
              <AlertTitle>Terjadi Kesalahan</AlertTitle>
              <AlertDescription>
                <p className="break-words">{errorMessage}</p>
                {errorMessage.toLowerCase().includes('cors') && (
                  <p className="mt-2 text-xs">Aktifkan CORS di N8N: Settings - n8n settings - Allow CORS, atau aktifkan di Webhook node.</p>
                )}
                <Button variant="outline" size="sm" className="mt-3" onClick={handleReset}>Coba Lagi</Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Output Panel */}
          {isDone && result && <OutputPanel result={result} />}

          {/* Footer */}
          <footer className="text-center pt-2 pb-4">
            <p className="text-xs text-muted-foreground">
              Powered by <span className="text-foreground/60">N8N</span> + <span className="text-foreground/60">Gemini</span> + <span className="text-foreground/60">DeepSeek</span>
            </p>
          </footer>
        </div>

        <SettingsModal
          open={showSettings}
          webhookUrl={webhookUrl}
          sertakanTechStack={sertakanTechStack}
          sertakanKode={sertakanKode}
          onSave={(url) => { setWebhookUrl(url); saveWebhookUrl(url) }}
          onToggleTechStack={(v) => { setSertakanTechStack(v); savePref('sertakan_tech_stack', v) }}
          onToggleKode={(v) => { setSertakanKode(v); savePref('sertakan_kode', v) }}
          onClose={() => setShowSettings(false)}
        />
      </div>
    </TooltipProvider>
  )
}

interface ApprovalCardProps {
  analysis: AnalysisData
  designSystem: string
  sertakanTechStack: boolean
  sertakanKode: boolean
  feedback: string
  setFeedback: (v: string) => void
  onApprove: () => void
  onReject: () => void
}

function ApprovalCard({ analysis, designSystem, sertakanTechStack, sertakanKode, feedback, setFeedback, onApprove, onReject }: ApprovalCardProps) {
  const resiko = analysis.resiko ?? []
  const peluang = analysis.peluang ?? []
  const biaya = analysis.analisis_biaya ?? null

  return (
    <Card className="gap-0 p-0 overflow-hidden">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Hasil Analisis Ide</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Periksa apakah AI sudah memahami idemu sebelum PRD dibuat.</p>
          </div>
          {analysis.complexity_level && <Badge variant="outline" className="shrink-0">{analysis.complexity_level}</Badge>}
        </div>

        {analysis.project_name && (
          <p className="text-sm text-foreground font-medium">
            Project: {analysis.project_name}
            <span className="text-muted-foreground font-normal"> · {analysis.platform} · {analysis.estimasi_skala}</span>
          </p>
        )}
        {analysis.ide_inti && <p className="text-sm text-muted-foreground">{analysis.ide_inti}</p>}

        {resiko.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Risiko</h4>
            <ul className="space-y-2">
              {resiko.map((r, i) => (
                <li key={i} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{r.resiko}</p>
                    <Badge
                      variant={r.dampak?.toLowerCase() === 'tinggi' ? 'destructive' : r.dampak?.toLowerCase() === 'sedang' ? 'default' : 'outline'}
                      className="shrink-0"
                    >{r.dampak}</Badge>
                  </div>
                  {r.mitigasi && <p className="text-xs text-muted-foreground mt-1.5">Mitigasi: {r.mitigasi}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {peluang.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Peluang</h4>
            <ul className="list-disc pl-5 space-y-1">
              {peluang.map((p, i) => <li key={i} className="text-sm text-muted-foreground">{p}</li>)}
            </ul>
          </div>
        )}

        {biaya && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Analisis Biaya</h4>
            {biaya.ada_biaya ? (
              <>
                {biaya.kesimpulan && <p className="text-sm text-muted-foreground mb-2">{biaya.kesimpulan}</p>}
                {(biaya.rincian_biaya ?? []).length > 0 && (
                  <div className="rounded-md border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Komponen</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Keterangan</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Perkiraan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {biaya.rincian_biaya.map((b, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-3 py-2 font-medium text-foreground">{b.komponen}</td>
                            <td className="px-3 py-2 text-muted-foreground">{b.keterangan}</td>
                            <td className="px-3 py-2 text-foreground">{b.kira_kira}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{biaya.kesimpulan || 'Tidak ada biaya berarti untuk membangun aplikasi ini.'}</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {sertakanTechStack && <Badge variant="outline">Design system: {designSystem}</Badge>}
          <Badge variant="outline">{sertakanTechStack ? 'Dengan tech stack' : 'Tanpa tech stack'}</Badge>
          <Badge variant="outline">{sertakanKode ? 'Dengan kode' : 'Tanpa kode'}</Badge>
        </div>

        <div className="grid gap-2 pt-1">
          <Label htmlFor="feedback">Koreksi / catatan untuk AI (opsional)</Label>
          <Textarea
            id="feedback"
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Contoh: target penggunanya bukan developer, tapi tim RND internal..."
            rows={2}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button className="flex-1" onClick={onApprove}>
            <CheckCircle2 size={16} /> Setuju & Lanjutkan ke PRD
          </Button>
          <Button variant="outline" className="flex-1" onClick={onReject}>
            <XCircle size={16} /> Perbaiki Analisis
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
