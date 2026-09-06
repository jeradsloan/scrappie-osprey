(function() {
  var $ = document.querySelector.bind(document),
      $$ = document.querySelectorAll.bind(document),

      menuActive = false

  // Nav is fixed to top
  $('nav').classList.add('nav-fixed')
  $$('nav > .logo, nav > .nav-toggle').forEach(function(el) {
    el.style.visibility = 'visible'
    el.classList.add('show')
    el.classList.remove('hide')
  })

  function setNav(active) {
    menuActive = active
    $$('.nav-full, main').forEach(function(el) {
      el.classList.toggle('active', active)
    })
    var navFull = $('.nav-full')
    var icon = $('.nav-icon')
    if (navFull) navFull.setAttribute('aria-hidden', active ? 'false' : 'true')
    if (icon) {
      icon.setAttribute('aria-expanded', active ? 'true' : 'false')
      icon.querySelector('img:nth-of-type(1)').style.display = active ? 'none' : 'inline-block'
      icon.querySelector('img:nth-of-type(2)').style.display = active ? 'inline-block' : 'none'
    }
  }

  // Full screen nav open on click
  $('.nav-icon').addEventListener('click', function() {
    setNav(!menuActive)
  })

  // Full screen nav close on click
  $$('.nav-full a').forEach(function(links) {
    links.addEventListener('click', function() {
      setNav(false)
    })
  })

  // Fix logoBig drawing over nav when click on logoSmall while nav open
  $('.logo').addEventListener('click', function() {
    if (menuActive) setNav(false)
  })

  // Escape closes the full screen nav
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && menuActive) setNav(false)
  })

  // Disable scroll when full screen nav is open
  $('body').addEventListener('click', function() {
    if (menuActive) {
      $('html').style.overflowY = 'hidden'
    } else {
      $('html').style.overflowY = 'scroll'
    }
  })
})()
