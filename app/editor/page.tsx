'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Play, RotateCcw, Copy, Save, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface HtmlIssue {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning'
}

const VOID_ELEMENTS = new Set([
  'area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr'
])

function buildIndexToLineMap(text: string): number[] {
  const map: number[] = []
  let line = 1
  for (let i = 0; i < text.length; i++) {
    map.push(line)
    if (text[i] === '\n') line++
  }
  return map
}

function lintHtml(html: string): HtmlIssue[] {
  const issues: HtmlIssue[] = []
  const original = html

  // Basic checks
  const lines = original.split('\n')
  const firstNonEmptyIdx = lines.findIndex(l => l.trim().length > 0)
  if (firstNonEmptyIdx >= 0 && !/^<!DOCTYPE\s+html>/i.test(lines[firstNonEmptyIdx])) {
    issues.push({ line: firstNonEmptyIdx + 1, column: 1, message: 'Missing or invalid <!DOCTYPE html> declaration', severity: 'warning' })
  }

  // Mask (do NOT remove) comments and raw-text areas so indices remain aligned with original
  const mask = (s: string, re: RegExp) => s.replace(re, (m) => ' '.repeat(m.length))
  let text = original
  text = mask(text, /<!--[\s\S]*?-->/g)
  text = mask(text, /<script[\s\S]*?<\/script>/gi)
  text = mask(text, /<style[\s\S]*?<\/style>/gi)

  const idxToLine = buildIndexToLineMap(original)

  const tagRegex = /<\s*(\/)?\s*([a-zA-Z][a-zA-Z0-9:-]*)\b([^>]*)>/g
  const stack: Array<{ name: string; line: number }> = []
  let m: RegExpExecArray | null

  while ((m = tagRegex.exec(text)) !== null) {
    const isClosing = !!m[1]
    const name = m[2].toLowerCase()
    const attrs = m[3] || ''
    const index = m.index
    const line = idxToLine[Math.min(index, idxToLine.length - 1)] || 1

    // Attribute quote balancing (simple)
    const dbl = (attrs.match(/\\"/g) || []).length // escaped quotes
    const real = (attrs.match(/"/g) || []).length - dbl
    const sgl = (attrs.match(/'/g) || []).length
    if (real % 2 !== 0 || sgl % 2 !== 0) {
      issues.push({ line, column: 1, message: `Unmatched quote in attributes of <${name}>`, severity: 'error' })
    }

    const selfClosing = /\/>\s*$/.test(m[0]) || VOID_ELEMENTS.has(name)

    if (isClosing) {
      if (VOID_ELEMENTS.has(name)) {
        issues.push({ line, column: 1, message: `Void element <${name}> must not have a closing tag`, severity: 'error' })
        continue
      }
      if (stack.length === 0) {
        issues.push({ line, column: 1, message: `Unexpected closing </${name}>`, severity: 'error' })
      } else {
        const top = stack[stack.length - 1]
        if (top.name === name) {
          stack.pop()
        } else {
          // Find matching element in stack
          const idx = stack.map(s => s.name).lastIndexOf(name)
          if (idx === -1) {
            issues.push({ line, column: 1, message: `Closing </${name}> does not match any open tag`, severity: 'error' })
          } else {
            // Unclosed tags above
            for (let i = stack.length - 1; i > idx; i--) {
              const unclosed = stack[i]
              issues.push({ line: unclosed.line, column: 1, message: `Unclosed <${unclosed.name}> before </${name}>`, severity: 'error' })
            }
            stack.splice(idx)
          }
        }
      }
    } else if (!selfClosing) {
      stack.push({ name, line })
    }
  }

  // Any remaining unclosed tags
  for (const unclosed of stack) {
    if (!VOID_ELEMENTS.has(unclosed.name)) {
      issues.push({ line: unclosed.line, column: 1, message: `Unclosed <${unclosed.name}> tag`, severity: 'error' })
    }
  }

  // Duplicate id detection
  const idRegex = /\bid\s*=\s*(["'])((?:\\\1|(?!\1).)*)\1/gi
  const idMap = new Map<string, number[]>()
  let idMatch: RegExpExecArray | null
  while ((idMatch = idRegex.exec(original)) !== null) {
    const id = idMatch[2]
    const line = idxToLine[Math.min(idMatch.index, idxToLine.length - 1)] || 1
    const arr = idMap.get(id) || []
    arr.push(line)
    idMap.set(id, arr)
  }
  for (const [id, arr] of idMap) {
    if (arr.length > 1) {
      arr.forEach(l => issues.push({ line: l, column: 1, message: `Duplicate id="${id}"`, severity: 'warning' }))
    }
  }

  return issues.sort((a, b) => a.line - b.line || a.column - b.column)
}

export default function EditorPage() {
  const [code, setCode] = useState('')
  const [runCode, setRunCode] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [issues, setIssues] = useState<HtmlIssue[]>([])
  const [selectedLine, setSelectedLine] = useState<number | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const [scrollOffset, setScrollOffset] = useState<number>(0)
  const [backHref, setBackHref] = useState<string>('/')

  // Load code from sessionStorage on component mount
  useEffect(() => {
    const savedCode = sessionStorage.getItem('tryit_code')
    if (savedCode) {
      setCode(savedCode)
    } else {
      // Default HTML5 code if nothing in sessionStorage
      setCode(`<!DOCTYPE html>
<html>
<head>
<title>Page Title</title>
</head>
<body>

<h1>This is a Heading</h1>
<p>This is a paragraph.</p>

</body>
</html>`)
    }
    try {
      const from = sessionStorage.getItem('tryit_from') || '/'
      setBackHref(from)
    } catch {}
  }, [])

  const executeCode = () => {
    setIsRunning(true)
    const lint = lintHtml(code)
    setIssues(lint)
    setTimeout(() => {
      setRunCode(code)
      setIsRunning(false)
    }, 200)
  }

  const resetCode = () => {
    const defaultCode = `<!DOCTYPE html>
<html>
<head>
<title>Page Title</title>
</head>
<body>

<h1>This is a Heading</h1>
<p>This is a paragraph.</p>

</body>
</html>`
    setCode(defaultCode)
    setIssues([])
    setRunCode('')
  }

  const copyCode = () => {
    navigator.clipboard.writeText(code)
  }

  const saveCode = () => {
    // Save to sessionStorage/localStorage (preserving existing behavior)
    sessionStorage.setItem('tryit_code', code)
    localStorage.setItem('tryit_saved_code', code)
  }

  const handleCodeChange = (value: string) => {
    setCode(value)
    // keep quick-edit persistence without updating output automatically
    sessionStorage.setItem('tryit_code', value)
  }

  const errorLines = useMemo(() => new Set(issues.map(i => i.line)), [issues])

  const jumpToLine = (line: number) => {
    setSelectedLine(line)
    const ta = textAreaRef.current
    if (!ta) return
    const lines = ta.value.split('\n')
    let pos = 0
    for (let i = 0; i < Math.max(0, line - 1); i++) pos += lines[i].length + 1
    ta.focus()
    ta.setSelectionRange(pos, pos)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <a
              href={backHref}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              ← Back
            </a>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyCode}
                className="text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetCode}
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={saveCode}
                className="text-xs"
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={executeCode}
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2 fill-current" />
                  Run ›
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="h-[calc(100vh-80px)] flex overflow-hidden">
        {/* Left Side - Code Editor */}
        <div className="w-1/2 bg-white border-r border-gray-300 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Editor Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">HTML Editor</span>
                <span className="text-xs text-gray-500">index.html</span>
              </div>
            </div>

            {/* Issues Banner */}
            <div className="px-4 py-2 border-b border-gray-200 bg-white">
              {issues.length === 0 ? (
                <div className="text-xs text-gray-500">No issues detected. Click Run to validate and update the result.</div>
              ) : (
                <div className="flex items-start gap-2 text-red-600 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <div>
                    <div className="font-medium">{issues.filter(i=>i.severity==='error').length} errors, {issues.filter(i=>i.severity==='warning').length} warnings</div>
                    <div className="mt-1 max-h-24 overflow-auto pr-2 text-red-700">
                      {issues.map((iss, idx) => (
                        <div key={idx} className="cursor-pointer hover:underline" onClick={() => jumpToLine(iss.line)}>
                          Line {iss.line}: {iss.message}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Code Editor */}
            <div className="flex-1 relative overflow-hidden code-editor-container">
              <textarea
                ref={textAreaRef}
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                onScroll={(e) => {
                  const t = e.target as HTMLTextAreaElement
                  setScrollOffset(t.scrollTop)
                }}
                className="w-full h-full font-mono text-sm bg-white text-gray-800 border-none outline-none resize-none code-textarea"
                style={{
                  lineHeight: '1.5rem',
                  tabSize: 2,
                  paddingLeft: '3.5rem',
                  paddingTop: '1rem',
                  paddingBottom: '1rem',
                  paddingRight: '1rem'
                }}
                spellCheck={false}
              />
              
              {/* Line Numbers with error markers */}
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-50 border-r border-gray-200 overflow-hidden">
                <div 
                  className="font-mono text-sm relative line-numbers-container" 
                  style={{ 
                    transform: `translateY(-${scrollOffset}px)`,
                    paddingTop: '1rem',
                    paddingBottom: '1rem',
                    paddingLeft: '0.5rem',
                    paddingRight: '0.5rem',
                    lineHeight: '1.5rem'
                  }}
                >
                  {code.split('\n').map((_, index) => {
                    const lineNum = index + 1
                    const hasIssue = errorLines.has(lineNum)
                    const isSelected = selectedLine === lineNum
                    return (
                      <div
                        key={index}
                        className={`relative text-right select-none line-number-item ${hasIssue ? 'text-red-600 cursor-pointer hover:font-semibold' : 'text-gray-400'} ${isSelected ? 'bg-red-50 rounded-sm' : ''}`}
                        onClick={() => hasIssue && jumpToLine(lineNum)}
                        title={hasIssue ? 'Click to view issue' : ''}
                        style={{
                          height: '1.5rem',
                          lineHeight: '1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          position: 'relative'
                        }}
                      >
                        {hasIssue && (
                          <span className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                        {lineNum}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Result */}
        <div className="w-1/2 bg-white overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Result Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Result</span>
                <span className="text-xs text-gray-500">Updates on Run</span>
              </div>
            </div>
            
            {/* Result Area */}
            <div className="flex-1 bg-white overflow-hidden">
              {runCode ? (
                <iframe
                  srcDoc={
                    runCode?.includes('<head>') 
                      ? runCode.replace('<head>', `<head>
                          <base href="about:blank" target="_self">
                          <script>
                            document.addEventListener('DOMContentLoaded', function() {
                              document.addEventListener('click', function(e) {
                                const target = e.target.closest('a[href^="#"]');
                                if (target) {
                                  e.preventDefault();
                                  const hash = target.getAttribute('href').substring(1);
                                  const element = document.getElementById(hash);
                                  if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }
                                }
                              });
                            });
                          </script>`)
                      : runCode
                  }
                  className="w-full h-full border-none"
                  title="HTML5 Output"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-top-navigation-by-user-activation allow-downloads"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; ambient-light-sensor; autoplay; battery; camera; display-capture; document-domain; encrypted-media; execution-while-not-rendered; execution-while-out-of-viewport; fullscreen; geolocation; gyroscope; layout-animations; legacy-image-formats; magnetometer; microphone; midi; navigation-override; oversized-images; payment; picture-in-picture; publickey-credentials-get; sync-xhr; usb; vr; wake-lock; web-share; xr-spatial-tracking"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">Click Run to render your HTML5 output</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 