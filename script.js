(() => {
    try {
      console.log('Tamagotchi script loaded');

      const DEFAULT = { hunger: 100, happiness: 100, energy: 100, hygiene: 100, emoji: '🐶', dead: false }
      const KEY = 'tamagotchi:v1'

    const el = id => document.getElementById(id)
    const hungerEl = el('hunger'), happyEl = el('happiness'), energyEl = el('energy'), hygieneEl = el('hygiene')
    const hungerBar = el('hunger-bar'), happyBar = el('happiness-bar'), energyBar = el('energy-bar'), hygieneBar = el('hygiene-bar')
    const petImg = el('pet-img'), logEl = el('log')

    console.log({hungerEl,happyEl,energyEl,hygieneEl,hungerBar,happyBar,energyBar,hygieneBar,petImg,logEl})

    let state = load() || { ...DEFAULT }
    let loop = null

  // if we loaded a saved state that is marked dead but every stat is still
  // at its default value, assume it was just the earlier-death flag and reset
  if(state.dead && state.hunger === DEFAULT.hunger && state.happiness === DEFAULT.happiness && state.energy === DEFAULT.energy && state.hygiene === DEFAULT.hygiene) {
    state.dead = false
  }

  function save(){ localStorage.setItem(KEY, JSON.stringify(state)) }
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)) }catch(e){return null} }

  function clamp(v){ return Math.max(0, Math.min(100, Math.round(v))) }

  function setButtonsEnabled(enabled){
    ['feed','play','sleep','bathroom'].forEach(id=>{
      const b = el(id); if(b) b.disabled = !enabled
    })
  }

  function render(){
    hungerEl.textContent = clamp(state.hunger)
    happyEl.textContent = clamp(state.happiness)
    energyEl.textContent = clamp(state.energy)
    hygieneEl.textContent = clamp(state.hygiene)

    hungerBar.value = clamp(state.hunger)
    happyBar.value = clamp(state.happiness)
    energyBar.value = clamp(state.energy)
    hygieneBar.value = clamp(state.hygiene)

    // keep the image in sync with alive/dead state
    if(petImg){
      if(state.dead){
        petImg.src = 'assets/rip.png'
      } else {
        // choose current skin (default to first)
        const skins = ['assets/pet1.png', 'assets/pet2.png']
        petImg.src = skins[state.skin || 0] || skins[0]
      }
    }

    const card = document.querySelector('.pet-card')
    if(state.dead){
      card && card.classList.add('dead')
      setButtonsEnabled(false)
      el('reset').disabled = false
    } else {
      card && card.classList.remove('dead')
      setButtonsEnabled(true)
      el('reset').disabled = false
    }

    // always re-check death whenever we render (handles loads/edits)
    checkDeath()
  }

  function log(msg){ logEl.textContent = msg; setTimeout(()=>{ if(logEl.textContent === msg) logEl.textContent = '' }, 3000) }

  // Actions
  console.log('registering feed button')
  el('feed').addEventListener('click', ()=>{
    state.hunger = clamp(state.hunger + 20)
    state.energy = clamp(state.energy + 5)
    state.hygiene = clamp(state.hygiene - 10)
    log('You fed your pet.')
    save(); render(); checkDeath()
  })

  console.log('registering play button')
  el('play').addEventListener('click', ()=>{
    if(state.energy < 10){ log('Too tired to play.'); return }
    state.happiness = clamp(state.happiness + 15)
    state.hunger = clamp(state.hunger - 10)
    state.energy = clamp(state.energy - 20)
    state.hygiene = clamp(state.hygiene - 5)
    log('You played with your pet.')
    save(); render(); checkDeath()
  })

  console.log('registering sleep button')
  el('sleep').addEventListener('click', ()=>{
    log('Your pet is sleeping...')
    state.energy = 100
    state.hunger = clamp(state.hunger - 10)
    save(); render(); checkDeath()
  })

  console.log('registering bathroom button')
  el('bathroom').addEventListener('click', ()=>{
    log('Your pet used the bathroom and is clean!')
    state.hygiene = 100
    state.happiness = clamp(state.happiness + 5)
    state.energy = clamp(state.energy - 5)
    save(); render(); checkDeath()
  })

  console.log('registering reset button')
  el('reset').addEventListener('click', ()=>{
    state = { ...DEFAULT }
    // restart loop if it was stopped
    if(loop) clearInterval(loop)
    startLoop()
    // make sure pet image goes back to normal
    if(petImg) petImg.src = 'assets/pet 1.png'
    save(); render(); log('Reset to default.')
  })

  // clear the saved data entirely (useful if you accidentally kill pet and cannot paste into console)
  el('clear-storage').addEventListener('click', ()=>{
    localStorage.removeItem(KEY)
    state = { ...DEFAULT }
    if(loop) clearInterval(loop)
    startLoop()
    save(); render(); log('Storage cleared and pet reset.')
  })

  // debug: instant-kill button if you ever want to test death immediately
  const killBtn = document.createElement('button')
  killBtn.textContent = 'Kill (dev)'
  killBtn.style.marginLeft = '8px'
  killBtn.addEventListener('click', ()=>{ state.hunger = 0; render(); })
  document.querySelector('.controls').appendChild(killBtn)

  // once icon images load, hide their dashed border so they look like regular buttons
  document.querySelectorAll('.icon-btn img').forEach(img=>{
    img.addEventListener('load', ()=>{
      if(img.naturalWidth>1 && img.naturalHeight>1){
        const parent = img.parentElement
        if(parent) parent.style.border = 'none'
      }
    })
    // in case the image is already cached and loaded
    if(img.complete){
      if(img.naturalWidth>1 && img.naturalHeight>1){
        const parent = img.parentElement
        if(parent) parent.style.border = 'none'
      }
    }
  })

  // tap/click the pet image: cheer it up OR switch skin when not dead
  if(petImg){
    petImg.addEventListener('click', ()=>{
      if(state.dead) return
      // toggle between two designs
      state.skin = ((state.skin || 0) + 1) % 2
      state.happiness = clamp(state.happiness + 5)
      save(); render(); log('Pet purrs!')
    })
  }

  function checkDeath(){
    if(state.dead) return
    // death if any stat reaches 0
    if(clamp(state.hunger) <= 0 || clamp(state.happiness) <= 0 || clamp(state.energy) <= 0 || clamp(state.hygiene) <= 0){
      die()
    }
  }

  function die(){
    state.dead = true
    if(petImg) petImg.src = 'assets/rip.png'
    log('Your pet has died. Use Reset to try again.')
    save(); render()
    if(loop) { clearInterval(loop); loop = null }
  }

  function startLoop(){
    loop = setInterval(()=>{
      if(state.dead) return
      state.hunger = clamp(state.hunger - 1) // gets hungrier as this goes down
      state.hygiene = clamp(state.hygiene - 0.5)
      state.energy = clamp(state.energy - 0.5)

      // happiness lowers faster when hunger or hygiene are low
      const penalty = (state.hunger < 30 ? 2 : 0.5) + (state.hygiene < 30 ? 1 : 0)
      state.happiness = clamp(state.happiness - penalty)

      save(); render(); checkDeath()
    }, 3000)
  }

  console.log('starting loop')
  startLoop()

  render()
  console.log('initial render complete')
    } catch(e) {
      console.error('Tamagotchi script error', e);
    }
})();
