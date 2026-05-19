import '../styles/dragdrop.css';
import { formatBytes } from '../utils/formatBytes';

function fileEmoji(type = '') {
  if (type.startsWith('image')) return '🖼️';
  if (type.startsWith('video')) return '🎬';
  if (type.startsWith('audio')) return '🎵';
  if (type.includes('pdf'))    return '📄';
  if (type.match(/zip|rar|7z|tar|gz/)) return '🗜️';
  return '📁';
}

export default function FileCard({ file, onRemove }) {
  return (
    <div className="pd-file-card">
      <span className="pd-file-emoji">{fileEmoji(file.type)}</span>
      <div className="pd-file-info">
        <p className="pd-file-name">{file.name}</p>
        <p className="pd-file-size">{formatBytes(file.size)}</p>
      </div>
      <button className="pd-remove-btn" onClick={onRemove} title="Remove">×</button>
    </div>
  );
}
