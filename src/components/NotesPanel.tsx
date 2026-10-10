import { TaskItem, TaskList } from '@tiptap/extension-list'
import { Placeholder } from '@tiptap/extensions'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold, Download, Heading1, Heading2, IndentDecrease, IndentIncrease, Italic, List, ListChecks, ListOrdered, PenLine, Plus,
  RemoveFormatting, Strikethrough, TextQuote, Trash2, Underline,
} from 'lucide-react'
import { useT } from '../i18n'
import { downloadText } from '../lib/browser'
import { noteTitle, useNotes } from '../store/notes'
import { useUI } from '../store/ui'
import { Panel } from './Panel'

/** Conversion HTML → Markdown suffisante pour ce que l'éditeur produit. */
export function htmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const inline = (n: Node): string => {
    if (n.nodeType === Node.TEXT_NODE) return n.textContent || ''
    const el = n as HTMLElement
    const inner = [...el.childNodes].map(inline).join('')
    switch (el.tagName) {
      case 'STRONG': case 'B': return `**${inner}**`
      case 'EM': case 'I': return `*${inner}*`
      case 'S': return `~~${inner}~~`
      case 'U': return `<u>${inner}</u>`
      case 'CODE': return `\`${inner}\``
      case 'A': return `[${inner}](${el.getAttribute('href')})`
      case 'BR': return '\n'
      default: return inner
    }
  }
  const block = (el: Element, depth = 0): string => {
    const pad = '  '.repeat(depth)
    switch (el.tagName) {
      case 'H1': return `# ${inline(el)}`
      case 'H2': return `## ${inline(el)}`
      case 'H3': return `### ${inline(el)}`
      case 'P': return inline(el)
      case 'BLOCKQUOTE': return [...el.children].map((c) => `> ${block(c)}`).join('\n')
      case 'UL':
      case 'OL': {
        const task = el.getAttribute('data-type') === 'taskList'
        return [...el.children]
          .map((li, i) => {
            const checked = li.getAttribute('data-checked') === 'true'
            const bullet = task ? `- [${checked ? 'x' : ' '}]` : el.tagName === 'OL' ? `${i + 1}.` : '-'
            const parts = [...li.querySelectorAll(':scope > p, :scope > div > p')].map((p) => inline(p)).join(' ')
            const nested = [...li.querySelectorAll(':scope > ul, :scope > ol, :scope > div > ul, :scope > div > ol')].map((l) => block(l, depth + 1)).join('\n')
            return `${pad}${bullet} ${parts}${nested ? '\n' + nested : ''}`
          })
          .join('\n')
      }
      case 'HR': return '---'
      default: return inline(el)
    }
  }
  return [...doc.body.firstElementChild!.children].map((c) => block(c)).join('\n\n') + '\n'
}

function Btn({ on, label, active, children }: { on: () => void; label: string; active?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" className={`ed-btn ${active ? 'active' : ''}`} onMouseDown={(e) => e.preventDefault()} onClick={on} aria-label={label} title={label}>
      {children}
    </button>
  )
}

function NoteEditor({ noteId, initial }: { noteId: string; initial: string }) {
  const t = useT()
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: true, autolink: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: t('notes.placeholder') }),
    ],
    content: initial || '',
    onUpdate: ({ editor: ed }) => useNotes.getState().update(noteId, { html: ed.getHTML() }),
  })

  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed || !ed.isInitialized || ed.isDestroyed) return null
      let text = ''
      try {
        text = ed.getText()
      } catch {
        return null
      }
      return {
        words: text.trim() ? text.trim().split(/\s+/).length : 0,
        chars: text.length,
        bold: ed.isActive('bold'),
        italic: ed.isActive('italic'),
        underline: ed.isActive('underline'),
        strike: ed.isActive('strike'),
        h1: ed.isActive('heading', { level: 1 }),
        h2: ed.isActive('heading', { level: 2 }),
        ul: ed.isActive('bulletList'),
        ol: ed.isActive('orderedList'),
        task: ed.isActive('taskList'),
        quote: ed.isActive('blockquote'),
      }
    },
  })

  const c = () => editor!.chain().focus()
  const listItemType = state?.task ? 'taskItem' : 'listItem'
  return (
    <>
      {editor && state && (
        <div className="ed-toolbar" role="toolbar">
          <Btn on={() => c().toggleBold().run()} label="Gras / Bold" active={state.bold}><Bold size={15} /></Btn>
          <Btn on={() => c().toggleItalic().run()} label="Italique / Italic" active={state.italic}><Italic size={15} /></Btn>
          <Btn on={() => c().toggleUnderline().run()} label="Souligné / Underline" active={state.underline}><Underline size={15} /></Btn>
          <Btn on={() => c().toggleStrike().run()} label="Barré / Strike" active={state.strike}><Strikethrough size={15} /></Btn>
          <span className="ed-sep" />
          <Btn on={() => c().toggleHeading({ level: 1 }).run()} label="H1" active={state.h1}><Heading1 size={16} /></Btn>
          <Btn on={() => c().toggleHeading({ level: 2 }).run()} label="H2" active={state.h2}><Heading2 size={16} /></Btn>
          <Btn on={() => c().toggleBlockquote().run()} label="Citation / Quote" active={state.quote}><TextQuote size={15} /></Btn>
          <span className="ed-sep" />
          <Btn on={() => c().toggleBulletList().run()} label="Liste / List" active={state.ul}><List size={16} /></Btn>
          <Btn on={() => c().toggleOrderedList().run()} label="Liste numérotée / Numbered" active={state.ol}><ListOrdered size={16} /></Btn>
          <Btn on={() => c().toggleTaskList().run()} label="Cases à cocher / Checklist" active={state.task}><ListChecks size={16} /></Btn>
          <Btn on={() => c().sinkListItem(listItemType).run()} label="Indenter / Indent"><IndentIncrease size={16} /></Btn>
          <Btn on={() => c().liftListItem(listItemType).run()} label="Désindenter / Outdent"><IndentDecrease size={16} /></Btn>
          <span className="ed-sep" />
          <Btn on={() => c().unsetAllMarks().clearNodes().run()} label="Effacer la mise en forme / Clear formatting"><RemoveFormatting size={15} /></Btn>
        </div>
      )}
      <EditorContent editor={editor} className="editor" />
      {state && <div className="ed-count">{t('notes.count', { w: state.words, c: state.chars })}</div>}
    </>
  )
}

export function NotesPanel() {
  const t = useT()
  const open = useUI((s) => s.panel === 'notes')
  const notes = useNotes((s) => s.notes)
  const activeId = useNotes((s) => s.activeId)
  const update = useNotes((s) => s.update)
  const note = notes.find((n) => n.id === activeId) ?? notes[0]
  if (!note) return null

  return (
    <Panel
      open={open}
      wide
      className="notes-panel"
      icon={<PenLine size={18} />}
      title={t('notes.title')}
      actions={
        <>
          <select
            className="select small"
            value={note.id}
            onChange={(e) => useNotes.getState().setActive(e.target.value)}
            aria-label={t('notes.title')}
          >
            {notes.map((n) => (
              <option key={n.id} value={n.id}>
                {noteTitle(n, t('notes.untitled'))}
              </option>
            ))}
          </select>
          <button type="button" className="icon-btn" onClick={() => useNotes.getState().create()} aria-label={t('notes.new')} title={t('notes.new')}>
            <Plus size={17} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => downloadText(`${noteTitle(note, 'note').replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'note'}.md`, (note.title ? `# ${note.title}\n\n` : '') + htmlToMarkdown(note.html), 'text/markdown')}
            aria-label={t('notes.export')}
            title={t('notes.export')}
          >
            <Download size={16} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              if (window.confirm(t('notes.confirmDelete'))) useNotes.getState().remove(note.id)
            }}
            aria-label={t('notes.delete')}
            title={t('notes.delete')}
          >
            <Trash2 size={16} />
          </button>
        </>
      }
    >
      <input className="input bare note-title" value={note.title} onChange={(e) => update(note.id, { title: e.target.value })} placeholder={t('notes.titlePlaceholder')} />
      <NoteEditor key={note.id} noteId={note.id} initial={note.html} />
    </Panel>
  )
}
