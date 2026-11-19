// Sentence case: only the first letter capitalised. Words with capitals
// after their first letter or digits (HR, SaaS, 10.7M+) are left as they are.
export function sentenceCase(text: string) {
  let first = true;
  return text.replace(/\S+/g, (w) => {
    const keep = /\d/.test(w) || /[A-Z]/.test(w.slice(1));
    const out = keep ? w : first ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase();
    if (/[A-Za-z]/.test(w)) first = false;
    return out;
  });
}
