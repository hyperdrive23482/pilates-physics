import { createWriteStream } from 'node:fs'
import { buildCertificate } from '../api/_lib/build-certificate.js'

const doc = buildCertificate({
  workshop: {
    title: 'Pilates Physics 101',
    subtitle: null,
    description:
      'A foundations workshop on the mechanical principles behind Pilates apparatus — spring constants, supportive vs. resistive load, and how to read intention through the body’s lever system.',
    scheduled_at: '2026-04-18T19:00:00Z',
    duration_min: 120,
  },
  participantName: 'Jordan Reyes',
})

const out = process.argv[2] ?? 'test-cert.pdf'
doc.pipe(createWriteStream(out))
doc.end()
doc.on('end', () => console.log('wrote', out))
