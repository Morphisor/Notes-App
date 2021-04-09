import TextWithMarkdown from './TextWithMarkDown';

export default function NotePreview({body}) {
    return (
        <div className="note-preview">
            <TextWithMarkdown text={body} />
        </div>
    );
}