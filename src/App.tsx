import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Headphones,
  Heart,
  Music2,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react'

type Chapter = {
  image: string
  number: string
  eyebrow: string
  title: string
  description: string
  hint: string
}

const chapters: Chapter[] = [
  { image: '/references/page-1.jpg', number: '01', eyebrow: 'MID-AUTUMN FESTIVAL · 2026', title: '愿你月圆家圆', description: '一轮明月，照见远方。点击月亮，开启今夜的团圆。', hint: '点击月亮，进入下一页' },
  { image: '/references/page-2.jpg', number: '02', eyebrow: '月满中秋 · 千里共此时', title: '共赏一轮秋月', description: '月光越过屋檐，也越过山河，把想念送到每个人身边。', hint: '点击月亮，继续赏月' },
  { image: '/references/page-3.jpg', number: '03', eyebrow: 'HAPPY MID-AUTUMN FESTIVAL', title: '愿清辉常伴', description: '桂风送暖，月色澄明。接住三枚月饼，收下这一份好意。', hint: '完成小游戏，解锁下一页' },
  { image: '/references/page-4.jpg', number: '04', eyebrow: '花好月圆 · 欢喜满人间', title: '把祝福写进月色', description: '愿家人闲坐，灯火可亲。点亮团圆灯，继续向前。', hint: '点亮团圆灯，解锁下一页' },
  { image: '/references/page-5.jpg', number: '05', eyebrow: '月满清秋 · 桂映良宵', title: '盛满人间期许', description: '愿清辉常伴，岁岁平安相逢。中秋快乐，愿你所行皆有月光。', hint: '祝福已送达' },
]

const blessingLines = ['愿你有月可赏，有人相伴。', '愿家人闲坐，灯火可亲。', '愿生活明朗，万物可爱。', '愿这一轮月光，照亮你的来路。']
const sparkles = Array.from({ length: 26 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 96}%`,
  top: `${8 + ((index * 53) % 80)}%`,
  delay: `${(index % 8) * -0.55}s`,
  size: `${index % 4 === 0 ? 5 : 3}px`,
}))

function App() {
  const [chapterIndex, setChapterIndex] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [musicOn, setMusicOn] = useState(false)
  const [gameOpen, setGameOpen] = useState(false)
  const [gameScore, setGameScore] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [lanternLit, setLanternLit] = useState(false)
  const [unlocked, setUnlocked] = useState<boolean[]>([true, false, false, false, false])
  const [blessingIndex, setBlessingIndex] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [musicMessage, setMusicMessage] = useState('')
  const [pointer, setPointer] = useState({ x: 0, y: 0 })
  const [burst, setBurst] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const gameTimer = useRef<number | undefined>(undefined)
  const chapter = chapters[chapterIndex]

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      setPointer({
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * 2,
      })
    }
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [])

  const dateText = useMemo(() => new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date()), [])

  useEffect(() => () => window.clearTimeout(gameTimer.current), [])

  useEffect(() => {
    chapters.forEach((chapter) => {
      const image = new Image()
      image.src = chapter.image
    })
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const startMusic = async () => {
      try {
        await audio.play()
        setMusicOn(true)
        setMusicMessage('')
        cleanup()
      } catch {
        setMusicMessage('点击页面任意位置即可开启中秋音乐')
      }
    }

    const cleanup = () => {
      window.removeEventListener('pointerdown', startMusic)
      window.removeEventListener('keydown', startMusic)
    }

    void startMusic()
    window.addEventListener('pointerdown', startMusic, { once: true })
    window.addEventListener('keydown', startMusic, { once: true })

    return cleanup
  }, [])

  const changeChapter = (nextIndex: number, nextDirection: 'next' | 'prev' = 'next', allowLocked = false) => {
    if (transitioning || nextIndex < 0 || nextIndex >= chapters.length) return
    if (!allowLocked && !unlocked[nextIndex]) return
    setDirection(nextDirection)
    setTransitioning(true)
    window.setTimeout(() => { setChapterIndex(nextIndex); setTransitioning(false) }, 420)
  }

  const unlockAndAdvance = () => {
    const nextIndex = chapterIndex + 1
    if (nextIndex >= chapters.length) return
    setUnlocked((current) => current.map((value, index) => index <= nextIndex ? true : value))
    setBurst(true)
    window.setTimeout(() => setBurst(false), 900)
    changeChapter(nextIndex, 'next', true)
  }

  const toggleMusic = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (musicOn) {
      audio.pause()
      setMusicOn(false)
      setMusicMessage('')
      return
    }
    try {
      await audio.play()
      setMusicOn(true)
      setMusicMessage('')
    } catch {
      setMusicOn(false)
      setMusicMessage('点击页面任意位置即可开启中秋音乐')
      window.setTimeout(() => setMusicMessage(''), 4000)
    }
  }

  const startGame = () => { setGameOpen(true); setGameScore(0); setGameWon(false) }
  const catchMooncake = () => {
    if (gameWon) return
    const nextScore = gameScore + 1
    setGameScore(nextScore)
    if (nextScore >= 3) {
      setGameWon(true)
      gameTimer.current = window.setTimeout(() => { setGameOpen(false); unlockAndAdvance() }, 1100)
    }
  }

  const handleMoonClick = () => {
    setBlessingIndex((index) => (index + 1) % blessingLines.length)
    if (chapterIndex === 0 || chapterIndex === 1) unlockAndAdvance()
  }

  const handleLanternClick = () => {
    setLanternLit(true)
    if (chapterIndex === 3) window.setTimeout(unlockAndAdvance, 500)
  }

  return (
    <main
      className={`scroll-story ${transitioning ? 'is-transitioning' : ''} ${burst ? 'is-bursting' : ''}`}
      style={{ '--pointer-x': pointer.x, '--pointer-y': pointer.y } as React.CSSProperties}
    >
      <audio ref={audioRef} loop preload="auto" src={`${import.meta.env.BASE_URL}audio/国风中秋夜-花好月圆-汉服古装配乐_爱给网_aigei_com.mp3`} onError={() => { setMusicOn(false); setMusicMessage('音乐加载失败，请检查音频文件格式') }} />
      <div key={chapterIndex} className="story-image" style={{ backgroundImage: `url("${chapter.image}")` }} />
      <div className="story-image-overlay" />
      <div className="story-grain" />
      <div className="motion-clouds" aria-hidden="true">
        <span className="motion-cloud cloud-a" />
        <span className="motion-cloud cloud-b" />
        <span className="motion-cloud cloud-c" />
      </div>
      <div className="sparkle-field" aria-hidden="true">
        {sparkles.map((sparkle) => <i key={sparkle.id} style={{ left: sparkle.left, top: sparkle.top, animationDelay: sparkle.delay, width: sparkle.size, height: sparkle.size }} />)}
      </div>
      <div className="burst-field" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <i key={index} style={{ '--burst-angle': `${index * 30}deg` } as React.CSSProperties} />)}
      </div>

      <header className="story-header">
        <button className="story-brand" onClick={() => changeChapter(0, 'prev')} aria-label="返回第一页">
          <span className="brand-seal">月</span>
          <span><strong>月满</strong><small>中秋祝福笺</small></span>
        </button>
        <div className="header-tools">
          <span className="date-label">{dateText}</span>
          <button className={`music-button ${musicOn ? 'playing' : ''}`} onClick={toggleMusic} title={musicOn ? '关闭音乐' : '开启音乐'} aria-label={musicOn ? '关闭音乐' : '开启音乐'}>
            {musicOn ? <Volume2 size={16} /> : <VolumeX size={16} />}<span>{musicOn ? '关闭音乐' : '开启音乐'}</span>
          </button>
        </div>
      </header>

      <section key={chapterIndex} className={`chapter chapter-${chapterIndex + 1} direction-${direction}`}>
        <div className="chapter-meta"><span className="chapter-index">{chapter.number}</span><span className="chapter-line" /><span>{chapter.eyebrow}</span></div>
        <div className="chapter-copy">
          <span className="copy-kicker"><Sparkles size={14} /> {chapter.hint}</span>
          <h1>{chapter.title}</h1>
          <p>{chapter.description}</p>
          <div className="copy-actions">
          </div>
        </div>
        <div className="chapter-side">
          <div className="vertical-note">月圆 · 人圆 · 事事圆</div>
          <p className="orb-caption">{blessingLines[blessingIndex]}</p>
        </div>
        <div className="scene-object" aria-label="本页互动装置">
          {chapterIndex === 0 && <button className="scene-mooncake" onClick={handleMoonClick} aria-label="点击月饼月盘进入下一页"><span>月</span><i /></button>}
          {chapterIndex === 1 && <button className="scene-floating-moon" onClick={handleMoonClick} aria-label="点击悬浮月亮进入下一页"><span>共此时</span><i /></button>}
          {chapterIndex === 2 && <button className="scene-game-mooncake" onClick={startGame} aria-label="点击立体月饼开始游戏"><span>接月饼</span></button>}
          {chapterIndex === 3 && <button className={`scene-lantern ${lanternLit ? 'lit' : ''}`} onClick={handleLanternClick} aria-label="点击立体灯笼解锁下一页"><i /><b>团圆</b><em /></button>}
          {chapterIndex === 4 && <button className="scene-jade-rabbit" onClick={() => { setUnlocked([true, false, false, false, false]); setChapterIndex(0) }} aria-label="点击玉兔重新开始"><span>玉兔</span></button>}
        </div>
      </section>

      <footer className="story-footer">
        <div className="progress"><span>0{chapterIndex + 1}</span><div className="progress-track"><i style={{ width: `${((chapterIndex + 1) / chapters.length) * 100}%` }} /></div><span>0{chapters.length}</span></div>
        <div className="next-hint"><span>{chapterIndex < chapters.length - 1 ? '完成本页互动后继续' : '点击玉兔重新开始'}</span><Heart size={15} /></div>
      </footer>

      <div className="chapter-dots" aria-label="章节导航">{chapters.map((item, index) => <button key={item.number} className={`${index === chapterIndex ? 'active' : ''} ${unlocked[index] ? 'unlocked' : 'locked'}`} onClick={() => changeChapter(index, index < chapterIndex ? 'prev' : 'next')} aria-label={unlocked[index] ? `第${index + 1}页` : `第${index + 1}页未解锁`} />)}</div>
      <div className="music-tip"><Headphones size={13} /> 点击右上角，听一曲中秋</div>
      {musicMessage && <div className="music-message" role="status">{musicMessage}</div>}

      {gameOpen && <div className="game-layer" role="dialog" aria-modal="true" aria-label="接月饼小游戏">
        <div className="game-panel">
          <button className="game-close" onClick={() => setGameOpen(false)} aria-label="关闭小游戏">×</button>
          <span className="game-kicker"><Music2 size={14} /> 月下小游戏</span>
          <h2>接住三枚月饼</h2><p>点击飞过的月饼，把团圆和好运一起接回家。</p>
          <div className="game-score">已接住 <b>{gameScore}</b> / 3</div>
          <div className="game-board">
            {[0, 1, 2, 3, 4].map((item) => <button key={item} className={`falling-mooncake mooncake-${item}`} onClick={catchMooncake} aria-label="接住月饼"><span>月</span></button>)}
            {gameWon && <div className="game-success"><Heart size={22} fill="currentColor" /> 团圆接满，下一页见</div>}
          </div>
          <div className="game-controls"><button onClick={() => { setGameScore(0); setGameWon(false) }}><RotateCcw size={14} /> 重新开始</button><button onClick={() => setGameOpen(false)}><ArrowLeft size={14} /> 暂时离开</button></div>
        </div>
      </div>}
    </main>
  )
}

export default App
