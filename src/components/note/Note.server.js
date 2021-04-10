import {fetch} from 'react-fetch';
import {format} from 'date-fns';

import EditButton from '../menu/EditButton.client';
import NoteEditor from './NoteEditor.client';
import NotePreview from './NotePreview';

export default function Note({selectedId, isEditing}) {
  const note =
    selectedId != null
      ? fetch(`http://localhost:4000/notes/${selectedId}`).json()
      : null;

  if (note === null) {
    if (isEditing) {
      return (
        <NoteEditor noteId={null} initialTitle="Untitled" initialBody="" />
      );
    } else {
      return (
        <div className="note--empty-state">
          <span className="note-text--empty-state">
            Click a note on the left to view something! 🥺
          </span>
        </div>
      );
    }
  }

  let {id, title, body, updated_at} = note;
  const updatedAt = new Date(updated_at);

  if (isEditing) {
    return <NoteEditor noteId={id} initialTitle={title} initialBody={body} />;
  } else {
    return (
      <div className="note">
        <div className="note-header">
          <h1 className="note-title">{title}</h1>
          <div className="note-menu" role="menubar">
            <small className="note-updated-at" role="status">
              Last updated on {format(updatedAt, "d MMM yyyy 'at' h:mm bb")}
            </small>
            <EditButton noteId={id}>Edit</EditButton>
          </div>
        </div>
        <NotePreview body={body} />
      </div>
    );
  }
}

