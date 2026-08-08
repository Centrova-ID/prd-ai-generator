import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Package, ClipboardCheck } from 'lucide-react'
import { PreviewModal } from './PreviewModal'

export interface PrdFile {
  nomor: number
  nama_tahapan: string
  estimasi_durasi: string
  tech_focus: string[]
  deliverable: string
  filename: string
  content: string
}

export interface RisikoItem {
  resiko: string
  dampak: string
  mitigasi: string
}

export interface BiayaItem {
  komponen: string
  keterangan: string
  kira_kira: string
}

export interface AnalisisBiaya {
  ada_biaya: boolean
  kesimpulan: string
  rincian_biaya: BiayaItem[]
}

export interface PreferensiPRD {
  sertakan_tech_stack?: boolean
  sertakan_kode?: boolean
}

export interface ResultData {
  project_name: string
  platform: string
  complexity_level: string
  estimasi_skala: string
  total_tahapan: number
  prd_files: PrdFile[]
  resiko?: RisikoItem[]
  peluang?: string[]
  analisis_biaya?: AnalisisBiaya | null
  preferensi?: PreferensiPRD
}

interface Props {
  result: ResultData
}

function downloadPRD(prd: PrdFile) {
  const blob = new Blob([prd.content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = prd.filename
  a.click()
  URL.revokeObjectURL(url)
}

async function downloadAll(result: ResultData) {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const folderName = result.project_name.replace(/\s+/g, '_') || 'PRD_Files'
  const folder = zip.folder(folderName)!
  result.prd_files.forEach(prd => folder.file(prd.filename, prd.content))
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `PRD_${folderName}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

export function OutputPanel({ result }: Props) {
  const [preview, setPreview] = useState<PrdFile | null>(null)
  const [zipping, setZipping] = useState(false)

  async function handleDownloadAll() {
    setZipping(true)
    try { await downloadAll(result) } finally { setZipping(false) }
  }

  return (
    <>
      <AnalysisCard result={result} />

      <Card className="gap-0 p-0 overflow-hidden">
        {/* Header */}
        <CardHeader className="border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>PRD Files Siap Diunduh</CardTitle>
              <CardDescription className="mt-1">{result.total_tahapan} file berhasil dibuat</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadAll} disabled={zipping}>
              <Package size={14} />
              {zipping ? 'Menyiapkan...' : 'Download Semua (.zip)'}
            </Button>
          </div>
        </CardHeader>

        {/* Project info bar */}
        <CardContent className="border-b border-border py-3">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <span className="text-muted-foreground">Project: <span className="font-medium text-foreground">{result.project_name}</span></span>
            <Separator orientation="vertical" className="hidden sm:block h-4" />
            <span className="text-muted-foreground">Platform: <span className="font-medium text-foreground capitalize">{result.platform}</span></span>
            <Separator orientation="vertical" className="hidden sm:block h-4" />
            <span className="text-muted-foreground">Skala: <span className="font-medium text-foreground">{result.estimasi_skala}</span></span>
            <Separator orientation="vertical" className="hidden sm:block h-4" />
            <Badge variant="outline">{result.complexity_level}</Badge>
          </div>
        </CardContent>

        {/* Cards grid */}
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.prd_files.map(prd => (
              <PrdCard key={prd.nomor} prd={prd} onDownload={() => downloadPRD(prd)} onPreview={() => setPreview(prd)} />
            ))}
          </div>
        </CardContent>
      </Card>

      <PreviewModal open={!!preview} title={preview ? `PRD Tahap ${preview.nomor} — ${preview.nama_tahapan}` : ''} content={preview?.content ?? ''} onClose={() => setPreview(null)} />
    </>
  )
}

function AnalysisCard({ result }: { result: ResultData }) {
  const resiko = result.resiko ?? []
  const peluang = result.peluang ?? []
  const biaya = result.analisis_biaya ?? null
  const pref = result.preferensi ?? {}

  return (
    <Card className="gap-0 p-0 overflow-hidden">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2"><ClipboardCheck size={16} /> Analisis Proyek</CardTitle>
        <CardDescription className="mt-1">Risiko, peluang, dan estimasi biaya yang dipertimbangkan sebelum penyusunan PRD.</CardDescription>
      </CardHeader>
      <CardContent className="py-4 space-y-5">
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

        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">{pref.sertakan_tech_stack === false ? 'Tanpa tech stack' : 'Dengan tech stack'}</Badge>
          <Badge variant="outline">{pref.sertakan_kode === false ? 'Tanpa kode' : 'Dengan kode'}</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function PrdCard({ prd, onDownload, onPreview }: { prd: PrdFile; onDownload: () => void; onPreview: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <Badge variant="secondary" className="shrink-0 tabular-nums">{prd.nomor}</Badge>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground leading-snug">{prd.nama_tahapan}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{prd.estimasi_durasi}</p>
        </div>
      </div>

      {prd.tech_focus.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {prd.tech_focus.slice(0, 4).map((tag, i) => (
            <Badge key={i} variant="outline" className="text-xs font-normal">{tag}</Badge>
          ))}
          {prd.tech_focus.length > 4 && (
            <Badge variant="outline" className="text-xs font-normal">+{prd.tech_focus.length - 4}</Badge>
          )}
        </div>
      )}

      {prd.deliverable && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{prd.deliverable}</p>
      )}

      <div className="flex gap-2 mt-auto pt-1">
        <Button size="sm" className="flex-1" onClick={onDownload}>
          Download
        </Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={onPreview}>
          Preview
        </Button>
      </div>
    </div>
  )
}
