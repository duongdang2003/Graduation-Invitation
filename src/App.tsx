import { useEffect, useRef, useState, type MouseEvent } from 'react'
import './App.css'

type Gender = 'male' | 'female'
type Screen = 'chest' | 'opening' | 'invite'
type InvitationPerson = { id: string; name: string }
type InvitationData = { people: InvitationPerson[] }
type Impact = { x: number; y: number; key: number; opening: boolean }
type Firework = { key: number; x: number; y: number }

const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

const assets = {
  male: { idleChest: asset('/Assets/Chests/MetalChestsIdle.gif'), openSheet: asset('/Assets/Chests/MetalChestOpen.png'), openFinal: asset('/Assets/Chests/MetalChestOpenFinal.png'), character: asset('/Assets/Characters/KnightIdle.gif'), label: 'Hiệp sĩ' },
  female: { idleChest: asset('/Assets/Chests/IceChestIdle.gif'), openSheet: asset('/Assets/Chests/IceChestOpen.png'), openFinal: asset('/Assets/Chests/IceChestOpenFinal.png'), character: asset('/Assets/Characters/ElfIdle.gif'), label: 'Tiên nữ' },
}

function readInvitationId(id: string | null) {
  if (!id || !/^[12][012]\d{5}$/.test(id)) return null
  const gender = id[0] === '1' ? 'male' as const : 'female' as const
  const relationshipCode = id[1]
  const isOlder = id[1] === '1'
  return {
    fullId: id,
    gender,
    salutation: relationshipCode === '0' ? 'BẠN' : gender === 'male' ? (isOlder ? 'ANH' : 'EM') : (isOlder ? 'CHỊ' : 'EM'),
    personCode: id.slice(2),
  }
}

function randomFirework(key: number): Firework {
  const halfFirework = 72
  const width = Math.max(0, window.innerWidth - halfFirework * 2)
  const height = Math.max(0, window.innerHeight - halfFirework * 2)
  return { key, x: halfFirework + Math.random() * width, y: halfFirework + Math.random() * height }
}

function App() {
  const initialInvite = readInvitationId(new URLSearchParams(window.location.search).get('id'))
  const [gender] = useState<Gender>(initialInvite?.gender ?? 'male')
  const salutation = initialInvite?.salutation ?? 'BẠN'
  const [screen, setScreen] = useState<Screen>('chest')
  const [tapCount, setTapCount] = useState(0)
  const [recipientName, setRecipientName] = useState('THẢO NGUYÊN')
  const [impact, setImpact] = useState<Impact | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const [transitionStartedAt, setTransitionStartedAt] = useState<number | null>(null)
  const [flashElapsed, setFlashElapsed] = useState(0)
  const [firework, setFirework] = useState<Firework | null>(null)
  const openingStarted = useRef(false)
  const current = assets[gender]

  useEffect(() => {
    const url = new URL(window.location.href)
    const parsedId = readInvitationId(url.searchParams.get('id'))
    if (!parsedId) return

    fetch(asset('/data/invitations.json'))
      .then((response) => response.json() as Promise<InvitationData>)
      .then((data) => {
        const person = data.people.find((entry) => entry.id === parsedId.fullId)
        if (person) setRecipientName(person.name)
      })
      .catch(() => undefined)
  }, [])

  const handleTap = (event: MouseEvent<HTMLElement>) => {
    if (screen !== 'chest' || openingStarted.current) return
    const nextCount = tapCount + 1
    setImpact({ x: event.clientX, y: event.clientY, key: shakeKey + 1, opening: nextCount === 3 })
    setShakeKey((key) => key + 1)
    setTapCount(nextCount)
    if (nextCount === 3) {
      openingStarted.current = true
      setFlashElapsed(0)
      setFirework(null)
      setScreen('opening')

      // Start the flash as soon as the 550ms sprite animation reaches its
      // final frame.
      window.setTimeout(() => {
        setTransitionStartedAt(Date.now())
        setFlashElapsed(0)
        // Fade to white for 1s while keeping the chest page visible. Only
        // switch pages once the flash has reached full brightness.
        window.setTimeout(() => {
          setFlashElapsed(1000)
          setScreen('invite')
          // Let the new page mount under a solid white overlay first, then
          // resume the fade-out on the next frame to avoid a one-frame blink.
          window.setTimeout(() => setFlashElapsed(1001), 16)
        }, 1000)
      }, 550)
      window.setTimeout(() => { setFlashElapsed(2000); setFirework(randomFirework(Date.now())) }, 2000)
    }
  }

  if (screen === 'invite') {
    return (
      <main className={`invitation-page ${gender}`}>
        {transitionStartedAt && <div className="page-flash active" style={flashElapsed === 1000 ? { animation: 'none', opacity: 1 } : { animationDelay: `${-flashElapsed}ms` }} aria-hidden="true" />}
        {firework && <img className="firework" key={firework.key} src={asset('/Assets/VFX/firework.gif')} alt="" style={{ left: firework.x, top: firework.y }} onAnimationEnd={() => setFirework(randomFirework(Date.now()))} />}
        <article className="invitation-card">
          <div className="card-inner">
            <img className="compass-icon" src={asset('/Assets/Icons/compass%20(1).png')} alt="" aria-hidden="true" />
            <div className="card-title-block">
              <h1><span className="title-main">THIỆP MỜI</span><span className="title-subtitle">LỄ TỐT NGHIỆP</span></h1>
            </div>
            {/* <div className="ornament" aria-hidden="true">◆ ─── ✦ ─── ◆</div> */}
            <div className="event-layout">
              <div className="recipient-block">
                <p className="event-invite">THÂN MỜI {salutation}</p>
                <h2 className="recipient-name">{recipientName.toUpperCase()}</h2>
                <p className="event-time">đến dự buổi lẽ tốt nghiệp của Hải Đăng</p>
              </div>
              <div className="details-block">
                <p className="event-time date-time"><span>17/06/2025</span><img className="date-book-icon" src={asset('/Assets/Icons/book.png')} alt="" aria-hidden="true" /><span>10:00 - 13:00</span></p>
                <p className="event-school">SẢNH A ĐẠI HỌC TÔN ĐỨC THẮNG</p>
                <p className="event-location">(19 Nguyễn Hữu Thọ, Phường Tân Hưng, TPHCM)</p>
                <p className="event-phone">SĐT: 0765 079 531</p>
              </div>
            </div>
            <img className="character" src={current.character} alt={current.label} />
          </div>
        </article>
      </main>
    )
  }

  return (
    <main className={`chest-page ${gender}`} onClick={handleTap}>
      <div className="ambient-glow" aria-hidden="true" />
      {transitionStartedAt && <div className="page-flash active" style={{ animationDelay: `${-flashElapsed}ms` }} aria-hidden="true" />}
      {impact && <img className={`impact-effect ${impact.opening ? 'opening-impact' : ''}`} key={impact.key} src={asset('/Assets/VFX/impact.gif')} alt="" style={{ left: impact.x, top: impact.y }} onAnimationEnd={() => setImpact(null)} />}
      <div className={`shake-stage ${shakeKey ? 'shake-now' : ''}`} key={shakeKey}>
        <button className={`chest-button ${screen === 'opening' ? 'opening' : ''}`} type="button" onClick={(event) => { event.stopPropagation(); handleTap(event) }} aria-label={`Mở rương, lần chạm ${tapCount} trên 3`}>
          <span className="tap-label">CHẠM ĐỂ MỞ</span>
          {screen === 'opening' ? (
            <span className="chest-open-sprite" style={{ backgroundImage: `url(${current.openSheet})` }} role="img" aria-label={`${current.label} chest opening`} />
          ) : (
            <img src={current.idleChest} alt={`${current.label} chest`} />
          )}
        </button>
      </div>
    </main>
  )
}

export default App
