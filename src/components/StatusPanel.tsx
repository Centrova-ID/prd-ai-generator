import { useEffect, useRef, useState } from 'react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import { Check, ChevronDown } from 'lucide-react'

export type AppStatus = 'idle' | 'analyzing' | 'approval' | 'generating' | 'done' | 'error'

export interface TimelineStep {
  id: string
  label: string
  description: string
  state: 'waiting' | 'active' | 'done' | 'error'
  logs: string[]
}

interface Props {
  status: AppStatus
  steps: TimelineStep[]
}

export function StatusPanel({ status, steps }: Props) {
  if (status === 'idle') return null

  return (
    <Card className="gap-0 p-0 overflow-hidden">
      <div className="p-4 space-y-1">
        {steps.map((step, i) => (
          <StepRow key={step.id} step={step} isLast={i === steps.length - 1} />
        ))}
      </div>
    </Card>
  )
}

function StepRow({ step, isLast }: { step: TimelineStep; isLast: boolean }) {
  const [open, setOpen] = useState(step.state === 'active')
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (step.state === 'active' || step.state === 'error') {
      setOpen(true)
    } else if (step.state === 'done') {
      setOpen(false)
    }
  }, [step.state])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [step.logs])

  const hasLogs = step.logs.length > 0

  return (
    <div className="relative">
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
      )}

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center gap-3 w-full py-2 text-left">
          <StepCircle state={step.state} />

          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium leading-tight ${step.state === 'waiting' ? 'text-muted-foreground' : 'text-foreground'}`}>
              {step.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{step.description}</p>
          </div>

          {hasLogs && (
            <ChevronDown
              size={14}
              className={`text-muted-foreground transition-transform duration-200 ${open ? '' : 'rotate-[-90deg]'}`}
            />
          )}
        </CollapsibleTrigger>

        {hasLogs && (
          <CollapsibleContent>
            <div className="ml-8 mb-2 mt-1">
              <ScrollArea className="max-h-32 rounded-md border border-border bg-background">
                <div
                  ref={logRef}
                  className="p-2.5 font-mono text-xs leading-relaxed"
                >
                  {step.logs.map((line, i) => (
                    <div
                      key={i}
                      className={
                        line.includes('Gagal') ? 'text-destructive' :
                        line.includes('Selesai') ? 'text-foreground' :
                        'text-muted-foreground'
                      }
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  )
}

function StepCircle({ state }: { state: TimelineStep['state'] }) {
  if (state === 'done') {
    return (
      <div className="shrink-0 w-8 h-8 rounded-full bg-foreground flex items-center justify-center">
        <Check size={14} className="text-background" strokeWidth={3} />
      </div>
    )
  }
  if (state === 'active') {
    return (
      <div className="shrink-0 w-8 h-8 rounded-full border-2 border-foreground flex items-center justify-center">
        <Spinner className="size-3.5 text-foreground" />
      </div>
    )
  }
  if (state === 'error') {
    return (
      <div className="shrink-0 w-8 h-8 rounded-full border-2 border-destructive flex items-center justify-center">
        <span className="text-xs font-bold text-destructive">!</span>
      </div>
    )
  }
  return (
    <div className="shrink-0 w-8 h-8 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
      <span className="text-xs font-semibold text-muted-foreground/50">·</span>
    </div>
  )
}
