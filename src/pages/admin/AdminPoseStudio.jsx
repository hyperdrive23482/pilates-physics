import { useEffect, useRef } from 'react'
import { useEnrollment } from '../../hooks/useEnrollment'
import AdminNav from '../../components/admin/AdminNav'

const MEDIAPIPE_SRC = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js'
const MEDIAPIPE_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/'
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=JetBrains+Mono:wght@400;500;700&display=swap'

const CONNECTIONS = [
  [11, 12],
  [11, 23], [12, 24], [23, 24],
  [11, 13], [13, 15],
  [12, 14], [14, 16],
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
]

function ensureFonts() {
  if (document.querySelector(`link[href="${FONTS_HREF}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = FONTS_HREF
  document.head.appendChild(link)
}

function loadMediaPipe() {
  if (window.Pose) return Promise.resolve()
  const existing = document.querySelector(`script[src="${MEDIAPIPE_SRC}"]`)
  if (existing) {
    return new Promise((resolve) => {
      const check = () => {
        if (window.Pose) resolve()
        else setTimeout(check, 50)
      }
      check()
    })
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = MEDIAPIPE_SRC
    s.crossOrigin = 'anonymous'
    s.onload = () => resolve()
    s.onerror = reject
    document.head.appendChild(s)
  })
}

export default function AdminPoseStudio() {
  const { user, signOut } = useEnrollment()
  const rootRef = useRef(null)

  useEffect(() => {
    ensureFonts()

    const root = rootRef.current
    if (!root) return

    const q = (sel) => root.querySelector(sel)
    const video = q('#ps-video')
    const canvas = q('#ps-canvas')
    const ctx = canvas.getContext('2d')
    const dropzone = q('#ps-dropzone')
    const fileInput = q('#ps-fileInput')
    const playBtn = q('#ps-playBtn')
    const restartBtn = q('#ps-restartBtn')
    const recordBtn = q('#ps-recordBtn')
    const cancelRecordBtn = q('#ps-cancelRecordBtn')
    const progressBar = q('#ps-progressBar')
    const progressFill = q('#ps-progressFill')
    const statusDot = q('#ps-statusDot')
    const statusText = q('#ps-statusText')
    const metaFrame = q('#ps-metaFrame')
    const metaFps = q('#ps-metaFps')
    const metaTracked = q('#ps-metaTracked')
    const toast = q('#ps-toast')
    const lineWeightInput = q('#ps-lineWeight')

    const state = {
      showSkeleton: true,
      showJoints: true,
      showVideo: true,
      showAngles: true,
      lineWeight: 4,
      pose: null,
      lastLandmarks: null,
      recording: false,
      recorder: null,
      recordChunks: [],
      frameCount: 0,
      lastTime: performance.now(),
      fps: 0,
      angleOverlays: {
        lelbow: true, relbow: true,
        lshoulder: true, rshoulder: true,
        lhip: true, rhip: true,
        lknee: true, rknee: true,
        spine: true, neck: true,
      },
    }

    let cancelled = false
    let rafId = null
    let objectUrl = null

    function setStatus(text, dotClass) {
      statusText.textContent = text
      statusDot.className = 'status-dot' + (dotClass ? ' ' + dotClass : '')
    }
    function showToast(msg) {
      toast.textContent = msg
      toast.classList.add('show')
      setTimeout(() => toast.classList.remove('show'), 2400)
    }

    // Paint backdrop
    canvas.width = 1280
    canvas.height = 720
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Toggle listeners
    const listeners = []
    const addL = (el, ev, fn) => {
      el.addEventListener(ev, fn)
      listeners.push([el, ev, fn])
    }

    root.querySelectorAll('[data-toggle]').forEach((el) => {
      addL(el, 'click', () => {
        el.classList.toggle('on')
        const key = el.getAttribute('data-toggle')
        if (key === 'skeleton') state.showSkeleton = el.classList.contains('on')
        if (key === 'joints') state.showJoints = el.classList.contains('on')
        if (key === 'video') state.showVideo = el.classList.contains('on')
        if (key === 'angles') state.showAngles = el.classList.contains('on')
      })
    })

    addL(lineWeightInput, 'input', (e) => {
      state.lineWeight = parseInt(e.target.value, 10)
    })

    root.querySelectorAll('[data-angle]').forEach((el) => {
      addL(el, 'click', () => {
        const key = el.getAttribute('data-angle')
        state.angleOverlays[key] = !state.angleOverlays[key]
        el.classList.toggle('off', !state.angleOverlays[key])
      })
    })

    // Load MediaPipe
    setStatus('loading model')
    loadMediaPipe()
      .then(() => {
        if (cancelled) return
        const pose = new window.Pose({
          locateFile: (file) => `${MEDIAPIPE_BASE}${file}`,
        })
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })
        pose.onResults(onPoseResults)
        state.pose = pose
        return pose.initialize()
      })
      .then(() => {
        if (!cancelled) setStatus('ready — drop a video', 'ready')
      })
      .catch((e) => {
        console.error(e)
        if (!cancelled) setStatus('model load failed')
      })

    // File handling
    addL(dropzone, 'click', () => fileInput.click())
    addL(dropzone, 'dragover', (e) => {
      e.preventDefault()
      dropzone.classList.add('drag')
    })
    addL(dropzone, 'dragleave', () => dropzone.classList.remove('drag'))
    addL(dropzone, 'drop', (e) => {
      e.preventDefault()
      dropzone.classList.remove('drag')
      if (e.dataTransfer.files[0]) loadVideo(e.dataTransfer.files[0])
    })
    addL(fileInput, 'change', (e) => {
      if (e.target.files[0]) loadVideo(e.target.files[0])
    })

    function loadVideo(file) {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      objectUrl = URL.createObjectURL(file)
      video.src = objectUrl
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        dropzone.classList.add('hidden')
        playBtn.disabled = false
        restartBtn.disabled = false
        recordBtn.disabled = false
        setStatus('ready to play', 'ready')
        video.currentTime = 0
        video.addEventListener('seeked', () => processCurrentFrame(), { once: true })
      }
    }

    // Playback
    addL(playBtn, 'click', () => {
      if (video.paused) {
        video.play()
        startRenderLoop()
      } else {
        video.pause()
      }
    })
    addL(restartBtn, 'click', () => {
      video.currentTime = 0
      video.pause()
      processCurrentFrame()
    })

    function startRenderLoop() {
      if (rafId) return
      const loop = async () => {
        if (cancelled) { rafId = null; return }
        if (video.paused || video.ended) { rafId = null; return }
        await processCurrentFrame()
        if (!cancelled) rafId = requestAnimationFrame(loop)
      }
      rafId = requestAnimationFrame(loop)
    }

    async function processCurrentFrame() {
      if (video.readyState < 2) return
      if (!state.pose) return
      try {
        await state.pose.send({ image: video })
      } catch (e) {
        console.warn('pose error', e)
      }
    }

    function onPoseResults(results) {
      state.lastLandmarks = results.poseLandmarks || null

      state.frameCount++
      const now = performance.now()
      if (now - state.lastTime > 500) {
        state.fps = Math.round(state.frameCount / ((now - state.lastTime) / 1000))
        state.frameCount = 0
        state.lastTime = now
        metaFps.textContent = state.fps
      }

      metaTracked.textContent = state.lastLandmarks ? 'yes' : 'no'
      if (video.duration) {
        metaFrame.textContent = video.currentTime.toFixed(2) + 's'
      }

      drawFrame()
      if (state.lastLandmarks && state.showAngles) {
        updateAnglePanel(state.lastLandmarks, canvas.width, canvas.height)
      }
    }

    function drawFrame() {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      if (state.showVideo) {
        ctx.drawImage(video, 0, 0, w, h)
      } else {
        ctx.fillStyle = '#1C1A17'
        ctx.fillRect(0, 0, w, h)
      }

      if (!state.lastLandmarks) return
      const lm = state.lastLandmarks

      if (state.showSkeleton) {
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = '#EF9F27'
        ctx.lineWidth = state.lineWeight
        ctx.shadowColor = 'rgba(239, 159, 39, 0.6)'
        ctx.shadowBlur = 8

        for (const [a, b] of CONNECTIONS) {
          const p1 = lm[a], p2 = lm[b]
          if (!p1 || !p2) continue
          if (p1.visibility < 0.3 || p2.visibility < 0.3) continue
          ctx.beginPath()
          ctx.moveTo(p1.x * w, p1.y * h)
          ctx.lineTo(p2.x * w, p2.y * h)
          ctx.stroke()
        }
        ctx.shadowBlur = 0
      }

      if (state.showJoints) {
        ctx.fillStyle = '#FFB856'
        const keyJoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]
        for (const i of keyJoints) {
          const p = lm[i]
          if (!p || p.visibility < 0.3) continue
          ctx.beginPath()
          ctx.arc(p.x * w, p.y * h, state.lineWeight + 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (state.showAngles) {
        drawAngleLabels(lm, w, h)
      }
    }

    function angleDeg(a, b, c) {
      const v1x = a.x - b.x, v1y = a.y - b.y
      const v2x = c.x - b.x, v2y = c.y - b.y
      const dot = v1x * v2x + v1y * v2y
      const m1 = Math.hypot(v1x, v1y)
      const m2 = Math.hypot(v2x, v2y)
      if (m1 === 0 || m2 === 0) return null
      const cos = Math.max(-1, Math.min(1, dot / (m1 * m2)))
      return Math.round((Math.acos(cos) * 180) / Math.PI)
    }

    function spineAngle(shoulderMid, hipMid) {
      const dx = shoulderMid.x - hipMid.x
      const dy = shoulderMid.y - hipMid.y
      const rad = Math.atan2(dx, -dy)
      return Math.round((Math.abs(rad) * 180) / Math.PI)
    }

    function mid(p1, p2) {
      return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
        visibility: Math.min(p1.visibility, p2.visibility),
      }
    }

    function computeAngles(lm, w, h) {
      // Scale normalized landmarks to pixel space so angle math isn't
      // distorted by non-square video aspect ratios.
      const get = (i) =>
        lm[i] && lm[i].visibility > 0.3
          ? { x: lm[i].x * w, y: lm[i].y * h, visibility: lm[i].visibility }
          : null
      const lShoulder = get(11), rShoulder = get(12)
      const lElbow = get(13), rElbow = get(14)
      const lWrist = get(15), rWrist = get(16)
      const lHip = get(23), rHip = get(24)
      const lKnee = get(25), rKnee = get(26)
      const lAnkle = get(27), rAnkle = get(28)
      const nose = get(0)

      const angles = {}
      if (lShoulder && lElbow && lWrist) angles.lelbow = angleDeg(lShoulder, lElbow, lWrist)
      if (rShoulder && rElbow && rWrist) angles.relbow = angleDeg(rShoulder, rElbow, rWrist)
      if (lElbow && lShoulder && lHip) angles.lshoulder = angleDeg(lElbow, lShoulder, lHip)
      if (rElbow && rShoulder && rHip) angles.rshoulder = angleDeg(rElbow, rShoulder, rHip)
      if (lShoulder && lHip && lKnee) angles.lhip = angleDeg(lShoulder, lHip, lKnee)
      if (rShoulder && rHip && rKnee) angles.rhip = angleDeg(rShoulder, rHip, rKnee)
      if (lHip && lKnee && lAnkle) angles.lknee = angleDeg(lHip, lKnee, lAnkle)
      if (rHip && rKnee && rAnkle) angles.rknee = angleDeg(rHip, rKnee, rAnkle)
      if (lShoulder && rShoulder && lHip && rHip) {
        angles.spine = spineAngle(mid(lShoulder, rShoulder), mid(lHip, rHip))
      }
      if (nose && lShoulder && rShoulder) {
        const shoulderMid = mid(lShoulder, rShoulder)
        angles.neck = angleDeg(
          { x: shoulderMid.x, y: shoulderMid.y - 0.1 * h },
          shoulderMid,
          nose,
        )
      }
      return angles
    }

    function updateAnglePanel(lm, w, h) {
      const a = computeAngles(lm, w, h)
      const set = (id, v) => {
        const el = q('#' + id)
        if (!el) return
        el.innerHTML = v != null ? `${v}<span class="deg">°</span>` : '—'
      }
      set('ps-ang-lelbow', a.lelbow)
      set('ps-ang-relbow', a.relbow)
      set('ps-ang-lshoulder', a.lshoulder)
      set('ps-ang-rshoulder', a.rshoulder)
      set('ps-ang-lhip', a.lhip)
      set('ps-ang-rhip', a.rhip)
      set('ps-ang-lknee', a.lknee)
      set('ps-ang-rknee', a.rknee)
      set('ps-ang-spine', a.spine)
      set('ps-ang-neck', a.neck)
    }

    function drawAngleLabels(lm, w, h) {
      const a = computeAngles(lm, w, h)
      const labelAtXY = (x, y, val, key) => {
        if (val == null) return
        if (!state.angleOverlays[key]) return
        const text = val + '°'
        ctx.font = `500 ${Math.max(12, w * 0.018)}px "JetBrains Mono", monospace`
        const padding = 4
        const m = ctx.measureText(text)
        const bx = x + 10, by = y - 10 - 14
        ctx.fillStyle = 'rgba(28, 26, 23, 0.85)'
        ctx.fillRect(bx - padding, by - padding, m.width + padding * 2, 20)
        ctx.fillStyle = '#EF9F27'
        ctx.fillText(text, bx, by + 10)
      }
      const labelAt = (idx, val, key) => {
        const p = lm[idx]
        if (!p || p.visibility < 0.3) return
        labelAtXY(p.x * w, p.y * h, val, key)
      }
      labelAt(11, a.lshoulder, 'lshoulder')
      labelAt(12, a.rshoulder, 'rshoulder')
      labelAt(13, a.lelbow, 'lelbow')
      labelAt(14, a.relbow, 'relbow')
      labelAt(23, a.lhip, 'lhip')
      labelAt(24, a.rhip, 'rhip')
      labelAt(25, a.lknee, 'lknee')
      labelAt(26, a.rknee, 'rknee')

      const lSh = lm[11], rSh = lm[12], lHip = lm[23], rHip = lm[24], nose = lm[0]
      if (
        lSh && rSh && lHip && rHip &&
        lSh.visibility > 0.3 && rSh.visibility > 0.3 &&
        lHip.visibility > 0.3 && rHip.visibility > 0.3
      ) {
        const sx = (lSh.x + rSh.x + lHip.x + rHip.x) / 4
        const sy = (lSh.y + rSh.y + lHip.y + rHip.y) / 4
        labelAtXY(sx * w, sy * h, a.spine, 'spine')
      }
      if (
        lSh && rSh && nose &&
        lSh.visibility > 0.3 && rSh.visibility > 0.3 && nose.visibility > 0.3
      ) {
        const nx = ((lSh.x + rSh.x) / 2 + nose.x) / 2
        const ny = ((lSh.y + rSh.y) / 2 + nose.y) / 2
        labelAtXY(nx * w, ny * h, a.neck, 'neck')
      }
    }

    // Recording
    addL(recordBtn, 'click', async () => {
      if (state.recording) return
      await startRecording()
    })
    addL(cancelRecordBtn, 'click', () => {
      if (state.recorder) {
        state.recorder.ondataavailable = null
        state.recorder.onstop = null
        state.recorder.stop()
      }
      cleanupRecording()
      showToast('recording canceled')
    })

    async function startRecording() {
      try {
        const stream = canvas.captureStream(30)
        const mimeCandidates = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
        ]
        let mime = ''
        for (const m of mimeCandidates) {
          if (MediaRecorder.isTypeSupported(m)) { mime = m; break }
        }
        state.recordChunks = []
        state.recorder = new MediaRecorder(stream, {
          mimeType: mime,
          videoBitsPerSecond: 8_000_000,
        })
        state.recorder.ondataavailable = (e) => {
          if (e.data.size > 0) state.recordChunks.push(e.data)
        }
        state.recorder.onstop = () => {
          const blob = new Blob(state.recordChunks, { type: 'video/webm' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `pose-overlay-${Date.now()}.webm`
          a.click()
          setTimeout(() => URL.revokeObjectURL(url), 1000)
          cleanupRecording()
          showToast('downloaded')
        }

        video.currentTime = 0
        await new Promise((res) => video.addEventListener('seeked', res, { once: true }))
        await processCurrentFrame()

        state.recording = true
        recordBtn.disabled = true
        cancelRecordBtn.style.display = ''
        cancelRecordBtn.disabled = false
        progressBar.style.display = ''
        setStatus('recording', 'processing')

        state.recorder.start()
        video.play()
        startRenderLoop()

        const onEnd = () => {
          video.removeEventListener('ended', onEnd)
          if (state.recording) state.recorder.stop()
        }
        video.addEventListener('ended', onEnd)

        const progressInterval = setInterval(() => {
          if (!state.recording) { clearInterval(progressInterval); return }
          if (video.duration) {
            progressFill.style.width = (video.currentTime / video.duration) * 100 + '%'
          }
        }, 100)
      } catch (e) {
        console.error(e)
        showToast('recording failed')
        cleanupRecording()
      }
    }

    function cleanupRecording() {
      state.recording = false
      recordBtn.disabled = false
      cancelRecordBtn.style.display = 'none'
      cancelRecordBtn.disabled = true
      progressBar.style.display = 'none'
      progressFill.style.width = '0%'
      setStatus('ready', 'ready')
    }

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
      if (state.recorder) {
        try {
          state.recorder.ondataavailable = null
          state.recorder.onstop = null
          state.recorder.stop()
        } catch {}
      }
      if (state.pose) {
        try { state.pose.close() } catch {}
      }
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn))
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav user={user} onSignOut={signOut} />
      <main
        ref={rootRef}
        className="pose-studio-root"
        style={{ maxWidth: '1400px', margin: '0 auto', padding: '6rem 2rem 4rem' }}
      >
        <style>{POSE_STUDIO_CSS}</style>

        <header className="ps-header">
          <div className="brand">
            <h1>
              pose <em>studio</em>
            </h1>
            <span className="tag">v0.1 · personal</span>
          </div>
          <div className="status">
            <span className="status-dot" id="ps-statusDot"></span>
            <span id="ps-statusText">loading model</span>
          </div>
        </header>

        <div className="layout">
          <div>
            <div className="stage">
              <div className="stage-inner">
                <video id="ps-video" playsInline muted></video>
                <canvas id="ps-canvas"></canvas>
                <div className="dropzone" id="ps-dropzone">
                  <div className="dropzone-icon">+</div>
                  <div className="dropzone-text">
                    <div className="big">Drop a video</div>
                    <div className="small">mp4 · mov · webm</div>
                  </div>
                  <input
                    type="file"
                    id="ps-fileInput"
                    accept="video/*"
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              <div className="stage-meta">
                <span>
                  frame <span className="meta-val" id="ps-metaFrame">—</span>
                </span>
                <span>
                  fps <span className="meta-val" id="ps-metaFps">—</span>
                </span>
                <span>
                  tracked <span className="meta-val" id="ps-metaTracked">no</span>
                </span>
              </div>
            </div>
          </div>

          <aside className="sidebar">
            <div className="card">
              <h3>
                Playback <span>ctrl</span>
              </h3>
              <div className="btn-group">
                <button id="ps-playBtn" disabled>▶ Play / Pause</button>
                <button id="ps-restartBtn" disabled>↺ Restart</button>
              </div>
            </div>

            <div className="card">
              <h3>
                Record <span>out</span>
              </h3>
              <div className="btn-group">
                <button id="ps-recordBtn" className="primary" disabled>
                  ● Record &amp; Download
                </button>
                <button
                  id="ps-cancelRecordBtn"
                  className="danger"
                  disabled
                  style={{ display: 'none' }}
                >
                  ■ Cancel
                </button>
              </div>
              <div className="progress-bar" id="ps-progressBar" style={{ display: 'none' }}>
                <div className="progress-fill" id="ps-progressFill"></div>
              </div>
            </div>

            <div className="card">
              <h3>
                Overlay <span>fx</span>
              </h3>
              <div className="row">
                <label>Skeleton</label>
                <div className="toggle on" data-toggle="skeleton"></div>
              </div>
              <div className="row">
                <label>Joints</label>
                <div className="toggle on" data-toggle="joints"></div>
              </div>
              <div className="row">
                <label>Show video</label>
                <div className="toggle on" data-toggle="video"></div>
              </div>
              <div className="row">
                <label>Angles</label>
                <div className="toggle on" data-toggle="angles"></div>
              </div>
              <div className="row">
                <label>Line weight</label>
                <input type="range" id="ps-lineWeight" min="2" max="10" defaultValue="4" />
              </div>
            </div>
          </aside>
        </div>

        <div className="card angles-full">
          <h3>
            Joint Angles <span>click to toggle</span>
          </h3>
          <div className="angles-grid">
            <div className="angle-item" data-angle="lelbow">
              <div className="label">L Elbow</div>
              <div className="val" id="ps-ang-lelbow">—</div>
            </div>
            <div className="angle-item" data-angle="relbow">
              <div className="label">R Elbow</div>
              <div className="val" id="ps-ang-relbow">—</div>
            </div>
            <div className="angle-item" data-angle="lshoulder">
              <div className="label">L Shoulder</div>
              <div className="val" id="ps-ang-lshoulder">—</div>
            </div>
            <div className="angle-item" data-angle="rshoulder">
              <div className="label">R Shoulder</div>
              <div className="val" id="ps-ang-rshoulder">—</div>
            </div>
            <div className="angle-item" data-angle="lhip">
              <div className="label">L Hip</div>
              <div className="val" id="ps-ang-lhip">—</div>
            </div>
            <div className="angle-item" data-angle="rhip">
              <div className="label">R Hip</div>
              <div className="val" id="ps-ang-rhip">—</div>
            </div>
            <div className="angle-item" data-angle="lknee">
              <div className="label">L Knee</div>
              <div className="val" id="ps-ang-lknee">—</div>
            </div>
            <div className="angle-item" data-angle="rknee">
              <div className="label">R Knee</div>
              <div className="val" id="ps-ang-rknee">—</div>
            </div>
            <div className="angle-item" data-angle="spine">
              <div className="label">Spine</div>
              <div className="val" id="ps-ang-spine">—</div>
            </div>
            <div className="angle-item" data-angle="neck">
              <div className="label">Neck</div>
              <div className="val" id="ps-ang-neck">—</div>
            </div>
          </div>
        </div>

        <footer className="ps-footer">
          <span>MediaPipe Pose · 33 landmarks</span>
          <span>Output: WebM · convert with HandBrake if needed</span>
        </footer>

        <div className="toast" id="ps-toast"></div>
      </main>
    </div>
  )
}

const POSE_STUDIO_CSS = `
  .pose-studio-root {
    --bg: #1C1A17;
    --panel: #242118;
    --panel-2: #2E2B26;
    --border: #2E2B26;
    --text: #F1EFE8;
    --text-dim: #888780;
    --accent: #EF9F27;
    --accent-2: #FFB856;
    --danger: #ff4a6b;
    color: var(--text);
    font-family: 'JetBrains Mono', monospace;
    position: relative;
  }
  .pose-studio-root * { box-sizing: border-box; }
  .pose-studio-root h1, .pose-studio-root h3 { margin: 0; }

  .pose-studio-root .ps-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .pose-studio-root .brand {
    display: flex;
    align-items: baseline;
    gap: 14px;
  }

  .pose-studio-root .brand h1 {
    font-family: 'Fraunces', serif;
    font-weight: 300;
    font-size: 42px;
    letter-spacing: -0.02em;
    font-style: italic;
    line-height: 1;
    color: var(--text);
  }

  .pose-studio-root .brand h1 em {
    font-weight: 600;
    font-style: normal;
    color: var(--accent);
  }

  .pose-studio-root .brand .tag {
    font-size: 10px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.2em;
    padding: 4px 10px;
    border: 1px solid var(--border);
    border-radius: 2px;
  }

  .pose-studio-root .status {
    font-size: 11px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.15em;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pose-studio-root .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-dim);
    transition: background 0.3s;
    display: inline-block;
  }

  .pose-studio-root .status-dot.ready { background: var(--accent); box-shadow: 0 0 8px var(--accent); }
  .pose-studio-root .status-dot.processing { background: var(--accent-2); animation: ps-pulse 1s infinite; }

  @keyframes ps-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .pose-studio-root .layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;
    margin-bottom: 16px;
  }

  @media (max-width: 960px) {
    .pose-studio-root .layout { grid-template-columns: 1fr; }
  }

  .pose-studio-root .stage {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    min-height: 400px;
  }

  .pose-studio-root .stage-inner {
    position: relative;
    background: #000;
    aspect-ratio: 16 / 9;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pose-studio-root .stage video,
  .pose-studio-root .stage canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .pose-studio-root .stage video { visibility: hidden; }
  .pose-studio-root .stage canvas { z-index: 2; }

  .pose-studio-root .dropzone {
    position: absolute;
    inset: 16px;
    border: 2px dashed var(--border);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 3;
    background: rgba(28, 26, 23, 0.6);
    backdrop-filter: blur(4px);
  }

  .pose-studio-root .dropzone:hover,
  .pose-studio-root .dropzone.drag {
    border-color: var(--accent);
    background: rgba(239, 159, 39, 0.04);
  }

  .pose-studio-root .dropzone.hidden { display: none; }

  .pose-studio-root .dropzone-icon {
    font-family: 'Fraunces', serif;
    font-size: 48px;
    font-style: italic;
    font-weight: 300;
    color: var(--accent);
  }

  .pose-studio-root .dropzone-text { text-align: center; }

  .pose-studio-root .dropzone-text .big {
    font-family: 'Fraunces', serif;
    font-size: 22px;
    font-weight: 400;
    letter-spacing: -0.01em;
    margin-bottom: 6px;
  }

  .pose-studio-root .dropzone-text .small {
    font-size: 11px;
    color: var(--text-dim);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .pose-studio-root .stage-meta {
    display: flex;
    justify-content: space-between;
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    font-size: 11px;
    color: var(--text-dim);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .pose-studio-root .meta-val { color: var(--text); }

  .pose-studio-root .sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .pose-studio-root .card {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 18px;
  }

  .pose-studio-root .card h3 {
    font-family: 'Fraunces', serif;
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 14px;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    color: var(--text);
  }

  .pose-studio-root .card h3 span {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: var(--text-dim);
    letter-spacing: 0.2em;
    font-weight: 400;
  }

  .pose-studio-root .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 12px;
    border-bottom: 1px solid var(--border);
  }
  .pose-studio-root .row:last-child { border-bottom: none; }
  .pose-studio-root .row label { color: var(--text-dim); letter-spacing: 0.05em; }

  .pose-studio-root input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100px;
    height: 2px;
    background: var(--border);
    outline: none;
  }
  .pose-studio-root input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
  }

  .pose-studio-root .toggle {
    position: relative;
    width: 32px;
    height: 18px;
    background: var(--border);
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .pose-studio-root .toggle::after {
    content: '';
    position: absolute;
    top: 2px; left: 2px;
    width: 14px; height: 14px;
    background: var(--text-dim);
    border-radius: 50%;
    transition: all 0.2s;
  }
  .pose-studio-root .toggle.on { background: var(--accent); }
  .pose-studio-root .toggle.on::after { left: 16px; background: #000; }

  .pose-studio-root button {
    font-family: inherit;
    font-size: 11px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 12px 16px;
    background: var(--panel-2);
    color: var(--text);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: all 0.15s;
  }
  .pose-studio-root button:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
  }
  .pose-studio-root button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .pose-studio-root button.primary {
    background: var(--accent);
    color: #000;
    border-color: var(--accent);
    font-weight: 700;
  }
  .pose-studio-root button.primary:hover:not(:disabled) {
    background: #D88A15;
    color: #000;
  }
  .pose-studio-root button.danger {
    border-color: var(--danger);
    color: var(--danger);
  }

  .pose-studio-root .btn-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pose-studio-root .angles-full { margin-top: 0; }

  .pose-studio-root .angles-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    font-size: 11px;
  }
  @media (max-width: 960px) {
    .pose-studio-root .angles-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 600px) {
    .pose-studio-root .angles-grid { grid-template-columns: repeat(2, 1fr); }
  }

  .pose-studio-root .angle-item {
    background: var(--panel-2);
    padding: 10px;
    border: 1px solid var(--border);
    cursor: pointer;
    user-select: none;
    transition: opacity 0.15s, border-color 0.15s;
  }
  .pose-studio-root .angle-item:hover { border-color: var(--accent); }
  .pose-studio-root .angle-item.off { opacity: 0.4; }
  .pose-studio-root .angle-item.off .val {
    text-decoration: line-through;
    text-decoration-color: var(--text-dim);
  }

  .pose-studio-root .angle-item .label {
    color: var(--text-dim);
    font-size: 9px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .pose-studio-root .angle-item .val {
    font-family: 'Fraunces', serif;
    font-size: 20px;
    font-weight: 400;
    color: var(--text);
  }

  .pose-studio-root .angle-item .val .deg {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-dim);
  }

  .pose-studio-root .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--panel);
    border: 1px solid var(--accent);
    padding: 12px 18px;
    border-radius: 2px;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s;
    z-index: 100;
    pointer-events: none;
  }
  .pose-studio-root .toast.show { opacity: 1; transform: translateY(0); }

  .pose-studio-root .progress-bar {
    height: 2px;
    background: var(--border);
    margin-top: 8px;
    overflow: hidden;
  }
  .pose-studio-root .progress-fill {
    height: 100%;
    background: var(--accent-2);
    width: 0;
    transition: width 0.1s;
  }

  .pose-studio-root .ps-footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }
`
