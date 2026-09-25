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

type FallingCake = {
  id: number
  x: number
  y: number
  speed: number
}

const introChapter: Chapter = {
  image: 'references/page-1.jpg',
  number: '00',
  eyebrow: 'A PERSONAL MID-AUTUMN LETTER',
  title: '写下你的名字，收下这轮月光',
  description: '让这一封中秋祝福，从你的名字开始。',
  hint: '输入名字，开启祝福',
}

const chapters: Chapter[] = [
  { image: 'references/page-1.jpg', number: '01', eyebrow: '见字如面 · A LETTER UNDER THE MOON', title: '见字如面', description: '{name}，见字如面。\n今夜月光很轻，刚好载得动一句想念。', hint: '点击月亮，进入下一页' },
  { image: 'references/page-2.jpg', number: '02', eyebrow: '月圆人愿 · MAKE A WISH', title: '月圆人愿', description: '月亮慢慢变圆，\n事情也会慢慢如愿。\n愿你所念之人，平安喜乐。', hint: '点击月亮，继续赏月' },
  { image: 'references/page-3.jpg', number: '03', eyebrow: '思念寄月 · SEND A WISH', title: '思念寄月', description: '如果今晚不能回家，\n就让桂香替你翻山越岭，\n让月光替我说一句：想你。', hint: '完成小游戏，解锁下一页' },
  { image: 'references/page-4.jpg', number: '04', eyebrow: '团圆有暖 · HOME IS HERE', title: '团圆有暖', description: '{name}，愿你手里有月饼，\n身边有家人，\n心里有归处。', hint: '点亮团圆灯，解锁下一页' },
  { image: 'references/page-5.jpg', number: '05', eyebrow: '生活如月 · BRIGHT AND TENDER', title: '生活如月', description: '愿你的生活，\n像今晚的月亮，\n明亮，圆满，温柔。', hint: '点击月光，继续收下祝福' },
  { image: 'references/page-2.jpg', number: '06', eyebrow: '好运常伴 · GOOD LUCK STAYS', title: '好运常伴', description: '把烦恼交给晚风，\n把思念寄给月亮，\n把好运留在{name}身边。', hint: '点击桂枝，继续向前' },
  { image: 'references/page-5.jpg', number: '07', eyebrow: 'A WISH FOR YOU', title: '中秋快乐', description: '中秋快乐，{name}。\n愿你岁岁常欢愉，年年皆胜意。', hint: '祝福已送达' },
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
  const [name, setName] = useState('')
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [musicOn, setMusicOn] = useState(false)
  const [gameOpen, setGameOpen] = useState(false)
  const [gameScore, setGameScore] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [gameLives, setGameLives] = useState(3)
  const [gameTime, setGameTime] = useState(20)
  const [basketX, setBasketX] = useState(50)
  const [gameMessage, setGameMessage] = useState('拖动玉兔篮，接住落下的月饼')
  const [cakes, setCakes] = useState<FallingCake[]>([])
  const [lanternLit, setLanternLit] = useState(false)
  const [unlocked, setUnlocked] = useState<boolean[]>([true, false, false, false, false, false, false, false])
  const [blessingIndex, setBlessingIndex] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [musicMessage, setMusicMessage] = useState('')
  const [pointer, setPointer] = useState({ x: 0, y: 0 })
  const [burst, setBurst] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const gameTimer = useRef<number | undefined>(undefined)
  const gameLoop = useRef<number | undefined>(undefined)
  const gameBoardRef = useRef<HTMLDivElement>(null)
  const basketXRef = useRef(50)
  const gameScoreRef = useRef(0)
  const gameLivesRef = useRef(3)
  const cakesRef = useRef<FallingCake[]>([])
  const lastFrameRef = useRef(0)
  const cakeIdRef = useRef(0)
  const chapter = chapters[Math.max(0, chapterIndex - 1)] ?? chapters[0]
  const isIntro = chapterIndex === 0
  const contentIndex = chapterIndex - 1
  const currentChapter = isIntro ? introChapter : chapters[contentIndex]

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

  useEffect(() => () => {
    window.clearTimeout(gameTimer.current)
    window.clearInterval(gameLoop.current)
  }, [])

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

  const startBlessing = () => {
    if (!name.trim()) return
    setUnlocked((current) => current.map((value, index) => index <= 1 ? true : value))
    setBurst(true)
    window.setTimeout(() => setBurst(false), 900)
    changeChapter(1, 'next', true)
  }

  const restartStory = () => {
    setName('')
    setLanternLit(false)
    setUnlocked([true, false, false, false, false, false, false, false])
    setChapterIndex(0)
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

  const startGame = () => {
    setGameOpen(true)
    setGameScore(0)
    setGameLives(3)
    setGameTime(20)
    setBasketX(50)
    basketXRef.current = 50
    gameScoreRef.current = 0
    gameLivesRef.current = 3
    setGameWon(false)
    setGameMessage('拖动玉兔篮，接住落下的月饼')
    const initialCakes = Array.from({ length: 3 }, (_, index) => ({
      id: index,
      x: 18 + index * 31,
      y: -16 - index * 25,
      speed: 22 + index * 5,
    }))
    cakesRef.current = initialCakes
    setCakes(initialCakes)
    lastFrameRef.current = performance.now()
  }

  const moveBasket = (clientX: number) => {
    const board = gameBoardRef.current
    if (!board) return
    const rect = board.getBoundingClientRect()
    const nextX = ((clientX - rect.left) / rect.width) * 100
    const clampedX = Math.max(12, Math.min(88, nextX))
    basketXRef.current = clampedX
    setBasketX(clampedX)
  }

  const finishGame = (won: boolean) => {
    if (gameLoop.current) cancelAnimationFrame(gameLoop.current)
    if (won) {
      setGameWon(true)
      setGameMessage('月饼接满了，团圆好运已收下')
      gameTimer.current = window.setTimeout(() => { setGameOpen(false); unlockAndAdvance() }, 1200)
    } else {
      setGameMessage('月光还在，重新来一局吧')
    }
  }

  const handleGamePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.buttons === 1) moveBasket(event.clientX)
  }

  useEffect(() => {
    if (!gameOpen || gameWon) return
    let secondAccumulator = 0
    const frame = (now: number) => {
      const delta = Math.min((now - lastFrameRef.current) / 1000, 0.05)
      lastFrameRef.current = now
      secondAccumulator += delta
      if (secondAccumulator >= 1) {
        secondAccumulator = 0
        setGameTime((time) => {
          if (time <= 1) {
            finishGame(false)
            return 0
          }
          return time - 1
        })
      }

      const board = gameBoardRef.current
      if (board) {
        const basketCenter = basketXRef.current
        const nextCakes = cakesRef.current
          .map((cake) => ({ ...cake, y: cake.y + cake.speed * delta }))
          .filter((cake) => {
            const hit = cake.y > 78 && cake.y < 91 && Math.abs(cake.x - basketCenter) < 12
            if (hit) {
              gameScoreRef.current += 1
              setGameScore(gameScoreRef.current)
              setGameMessage(gameScoreRef.current >= 5 ? '月饼接满了，团圆好运已收下' : '接住了！继续保持')
              if (gameScoreRef.current >= 5) finishGame(true)
              return false
            }
            if (cake.y > 104) {
              gameLivesRef.current -= 1
              setGameLives(gameLivesRef.current)
              setGameMessage(gameLivesRef.current > 0 ? '漏接一枚，调整位置继续' : '月光还在，重新来一局吧')
              if (gameLivesRef.current <= 0) finishGame(false)
              return false
            }
            return true
          })
        if (nextCakes.length < 3 && gameLivesRef.current > 0 && gameScoreRef.current < 5) {
          nextCakes.push({ id: cakeIdRef.current++, x: 10 + Math.random() * 80, y: -12, speed: 20 + Math.random() * 15 })
        }
        cakesRef.current = nextCakes
        setCakes(nextCakes)
      }
      gameLoop.current = requestAnimationFrame(frame)
    }
    gameLoop.current = requestAnimationFrame(frame)
    return () => {
      if (gameLoop.current) cancelAnimationFrame(gameLoop.current)
    }
  }, [gameOpen, gameWon])

  const handleMoonClick = () => {
    setBlessingIndex((index) => (index + 1) % blessingLines.length)
    if ([1, 2, 5].includes(chapterIndex)) unlockAndAdvance()
  }

  const handleLuckMooncakeClick = () => {
    if (chapterIndex !== 6) return
    setBlessingIndex((index) => (index + 1) % blessingLines.length)
    setUnlocked((current) => current.map((value, index) => index <= 7 ? true : value))
    setTransitioning(false)
    setBurst(true)
    window.setTimeout(() => setBurst(false), 900)
    setDirection('next')
    window.setTimeout(() => {
      setChapterIndex(7)
      setTransitioning(false)
    }, 80)
  }

  const handleLanternClick = () => {
    setLanternLit(true)
    if (chapterIndex === 4) window.setTimeout(unlockAndAdvance, 500)
  }

  const shareBlessing = async () => {
    const text = `中秋快乐，${name || '朋友'}。愿你岁岁常欢愉，年年皆胜意。`
    if (navigator.share) {
      await navigator.share({ title: '月满 · 中秋祝福', text }).catch(() => undefined)
    } else {
      await navigator.clipboard?.writeText(text)
      setMusicMessage('祝福已复制，可以分享给朋友')
      window.setTimeout(() => setMusicMessage(''), 2600)
    }
  }

  return (
    <main
      className={`scroll-story ${transitioning ? 'is-transitioning' : ''} ${burst ? 'is-bursting' : ''}`}
      style={{ '--pointer-x': pointer.x, '--pointer-y': pointer.y } as React.CSSProperties}
    >
      <audio ref={audioRef} loop preload="auto" src={`${import.meta.env.BASE_URL}audio/国风中秋夜-花好月圆-汉服古装配乐_爱给网_aigei_com.mp3`} onError={() => { setMusicOn(false); setMusicMessage('音乐加载失败，请检查音频文件格式') }} />
      <div key={chapterIndex} className="story-image" style={{ backgroundImage: `url("${currentChapter.image}")` }} />
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

      <section key={chapterIndex} className={`chapter chapter-${chapterIndex + 1} direction-${direction} ${isIntro ? 'intro-chapter' : ''}`}>
        <div className="chapter-meta"><span className="chapter-index">{currentChapter.number}</span><span className="chapter-line" /><span>{currentChapter.eyebrow}</span></div>
        <div className="chapter-copy">
          <span className="copy-kicker"><Sparkles size={14} /> {currentChapter.hint}</span>
          <h1>{currentChapter.title}</h1>
          {isIntro ? (
            <div className="name-entry">
              <input value={name} onChange={(event) => setName(event.target.value.slice(0, 16))} onKeyDown={(event) => event.key === 'Enter' && startBlessing()} placeholder="请输入你的名字" aria-label="请输入你的名字" />
              <button className="gold-button" onClick={startBlessing}><Sparkles size={16} /> 开启中秋祝福</button>
            </div>
          ) : <>
            {(currentChapter.description.includes('{name}') || [1, 4, 6, 7].includes(chapterIndex)) && (
              <div className="name-ribbon"><span>致</span><strong>{name || '你'}</strong><small>的中秋祝福</small></div>
            )}
            <p>{currentChapter.description.split('{name}').join(name || '你')}</p>
          </>}
          <div className="copy-actions">
          </div>
        </div>
        <div className="chapter-side">
          <div className="vertical-note">月圆 · 人圆 · 事事圆</div>
          <p className="orb-caption">{blessingLines[blessingIndex]}</p>
        </div>
        <div className="scene-object" aria-label="本页互动装置">
          {chapterIndex === 1 && <button className="scene-mooncake" onClick={handleMoonClick} aria-label="点击月饼月盘进入下一页"><span>月</span><i /></button>}
          {chapterIndex === 2 && <button className="scene-floating-moon" onClick={handleMoonClick} aria-label="点击悬浮月亮进入下一页"><span>共此时</span><i /></button>}
          {chapterIndex === 3 && <button className="scene-game-mooncake" onClick={startGame} aria-label="点击立体月饼开始游戏"><span>接月饼</span></button>}
          {chapterIndex === 4 && <button className={`scene-lantern ${lanternLit ? 'lit' : ''}`} onClick={handleLanternClick} aria-label="点击立体灯笼解锁下一页"><i /><b>团圆</b><em /></button>}
          {chapterIndex === 5 && <button className="scene-floating-moon" onClick={handleMoonClick} aria-label="点击月亮进入下一页"><span>生活</span><i /></button>}
          {chapterIndex === 6 && <button className="scene-luck-mooncake" onClick={handleLuckMooncakeClick} aria-label="点击好运月饼进入下一页"><span>好运</span><i /></button>}
          {chapterIndex === 7 && <button className="scene-jade-rabbit" onClick={restartStory} aria-label="点击玉兔重新开始"><span>玉兔</span></button>}
        </div>
        {chapterIndex === 7 && (
          <div className="final-actions">
            <button onClick={restartStory}><RotateCcw size={15} /> 再看一遍</button>
            <button onClick={shareBlessing}><Heart size={15} /> 送给朋友</button>
            <button onClick={() => window.print()}><Sparkles size={15} /> 保存祝福</button>
          </div>
        )}
      </section>

      <footer className="story-footer">
        <div className="progress"><span>0{chapterIndex}</span><div className="progress-track"><i style={{ width: `${(chapterIndex / 7) * 100}%` }} /></div><span>07</span></div>
        <div className="next-hint"><span>{isIntro ? '输入名字后开启' : chapterIndex < 7 ? '完成本页互动后继续' : '祝福已送达'}</span><Heart size={15} /></div>
      </footer>

      <div className="chapter-dots" aria-label="章节导航">{Array.from({ length: 8 }, (_, index) => <button key={index} className={`${index === chapterIndex ? 'active' : ''} ${unlocked[index] ? 'unlocked' : 'locked'}`} onClick={() => changeChapter(index, index < chapterIndex ? 'prev' : 'next')} aria-label={unlocked[index] ? `第${index}页` : `第${index}页未解锁`} />)}</div>
      <div className="music-tip"><Headphones size={13} /> 点击右上角，听一曲中秋</div>
      {musicMessage && <div className="music-message" role="status">{musicMessage}</div>}

      {gameOpen && <div className="game-layer" role="dialog" aria-modal="true" aria-label="接月饼小游戏">
        <div className="game-panel">
          <button className="game-close" onClick={() => setGameOpen(false)} aria-label="关闭小游戏">×</button>
          <span className="game-kicker"><Music2 size={14} /> 月下小游戏</span>
          <h2>接月饼 · 收团圆</h2><p>拖动玉兔篮左右移动，在月饼落到桌面前接住它。</p>
          <div className="game-stats"><span>已接住 <b>{gameScore}</b></span><span>剩余时间 <b>{gameTime}s</b></span><span>月兔篮 <b>{gameLives}</b> 条命</span></div>
          <div ref={gameBoardRef} className="game-board" onPointerMove={handleGamePointerMove} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); moveBasket(event.clientX) }}>
            <div className="game-moonline" />
            <div className="game-basket" style={{ left: `${basketX}%` }}><span>玉兔篮</span></div>
            {cakes.map((cake) => <span key={cake.id} className="falling-mooncake" style={{ left: `${cake.x}%`, top: `${cake.y}%` }}><span>月</span></span>)}
            {gameWon && <div className="game-success"><Heart size={22} fill="currentColor" /> 团圆接满，下一页见</div>}
          </div>
          <p className="game-live-message">{gameMessage}</p>
          <div className="game-controls"><button onClick={startGame}><RotateCcw size={14} /> 重新开始</button><button onClick={() => setGameOpen(false)}><ArrowLeft size={14} /> 暂时离开</button></div>
        </div>
      </div>}
    </main>
  )
}

export default App
