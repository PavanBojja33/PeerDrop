/**
 * Splits a File into ArrayBuffer chunks of the given size.
 * Yields objects: { chunk: ArrayBuffer, index: number, total: number }
 */
export const CHUNK_SIZE = 64 * 1024; // 64 KB per chunk

export async function* chunkFile(file, chunkSize = CHUNK_SIZE) {
  const totalChunks = Math.ceil(file.size / chunkSize);
  let offset = 0;
  let index = 0;

  while (offset < file.size) {
    const slice = file.slice(offset, offset + chunkSize);
    const buffer = await slice.arrayBuffer();
    yield { chunk: buffer, index, total: totalChunks };
    offset += chunkSize;
    index++;
  }
}

/**
 * Reassemble received chunks into a Blob.
 * @param {ArrayBuffer[]} chunks ordered array of received chunks
 * @param {string} fileType MIME type
 */
export function assembleFile(chunks, fileType) {
  return new Blob(chunks, { type: fileType || 'application/octet-stream' });
}
