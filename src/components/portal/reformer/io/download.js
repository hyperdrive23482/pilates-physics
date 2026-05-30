// The only DOM-touching IO helpers. Kept out of the pure modules so the rest
// of the codebase stays testable in a Node environment without jsdom.

export function downloadBlob(filename, mime, content) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function pickJsonFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = () => {
      const file = input.files && input.files[0]
      if (!file) {
        reject(new Error('No file chosen'))
        return
      }
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(reader.error || new Error('Read failed'))
      reader.readAsText(file)
    }
    input.click()
  })
}
