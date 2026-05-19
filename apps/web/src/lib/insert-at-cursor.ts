// Helper: wrap selected text trong textarea với markdown prefix/suffix.
// Trả về { value, selectionStart, selectionEnd } để caller apply.

export type InsertResult = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

export function wrapSelection(
  current: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after: string = before,
): InsertResult {
  const selected = current.slice(selectionStart, selectionEnd);
  const inserted = `${before}${selected}${after}`;
  const value = current.slice(0, selectionStart) + inserted + current.slice(selectionEnd);
  // Place cursor: nếu có selection → giữ select bọc original; nếu không → cursor giữa
  const newStart = selectionStart + before.length;
  const newEnd = newStart + selected.length;
  return { value, selectionStart: newStart, selectionEnd: newEnd };
}

/** Insert atomic text tại cursor position, replace selection nếu có. */
export function insertAt(
  current: string,
  selectionStart: number,
  selectionEnd: number,
  text: string,
): InsertResult {
  const value = current.slice(0, selectionStart) + text + current.slice(selectionEnd);
  const pos = selectionStart + text.length;
  return { value, selectionStart: pos, selectionEnd: pos };
}
