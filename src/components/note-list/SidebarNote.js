import { format, isToday } from "date-fns";
import excerpts from 'excerpts';
import marked from 'marked';

import ClientSidebarNote from './SidebarNote.client';

export default function SidebarNote({note}) {
    const updateAt = new Date(note.updated_at);
    const lastUpdatedAt = isToday(updateAt)
        ? format(updateAt, 'h:mm bb')
        : format(updateAt, 'd/M/yy');
    const summary = excerpts(marked(note.body), {words: 20});
    return (
        <ClientSidebarNote
            id={note.id}
            title={note.title}
            expandedChildren={
                <p className="sidebar-note-excerpt">{summary || <i>(No content)</i>}</p>
            }>
            <header className="sidebar-note-header">
                <strong>{note.title}</strong>
                <small>{lastUpdatedAt}</small>
            </header>
        </ClientSidebarNote>
    );
}