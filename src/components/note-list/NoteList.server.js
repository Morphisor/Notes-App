import {fetch} from 'react-fetch';

import SidebarNote from './SidebarNote';

export default function NoteList({searchText}) {
  const notes = fetch(
    'http://localhost:4000/notes?searchtext=' + encodeURIComponent(searchText)
  ).json();

  return notes.length > 0 ? (
    <ul className="notes-list">
      {notes.map((note) => (
        <li key={note.id}>
          <SidebarNote note={note} />
        </li>
      ))}
    </ul>
  ) : (
    <div className="notes-empty">
      {searchText
        ? `Couldn't find any notes titled "${searchText}".`
        : 'No notes created yet!'}{' '}
    </div>
  );
}

