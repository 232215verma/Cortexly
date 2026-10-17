import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function ThreeOrb() {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power', stencil: false })
    } catch {
      mount.classList.add('webgl-fallback')
      return undefined
    }

    // Keep the canvas at native or near-native resolution; sub-1x scales look
    // noticeably soft when stretched across modern phone screens.
    const getRenderScale = () => window.innerWidth < 700 ? 1.15 : 1
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, getRenderScale()))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.domElement.setAttribute('aria-hidden', 'true')
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 0.2, 7.2)

    const terrainUniforms = { uTime: { value: 0 }, uScroll: { value: 0 } }
    const terrain = new THREE.Mesh(new THREE.PlaneGeometry(22, 15, 44, 30), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: terrainUniforms,
      vertexShader: `
        uniform float uTime;
        uniform float uScroll;
        varying vec2 vUv;
        varying float vWave;
        void main() {
          vUv = uv;
          vec3 p = position;
          float wave = sin(p.x * 0.78 + uTime * 0.36) * 0.34 + cos(p.y * 0.92 - uTime * 0.24) * 0.27;
          wave += sin((p.x + p.y) * 0.48 + uTime * 0.2) * 0.28;
          p.z += wave + uScroll * (sin(p.x * 0.3 + uTime) * 0.42);
          vWave = wave;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying float vWave;
        void main() {
          vec2 cell = abs(fract(vUv * vec2(54.0, 38.0)) - 0.5);
          float line = 1.0 - smoothstep(0.012, 0.052, min(cell.x, cell.y));
          float crest = smoothstep(-0.24, 0.42, vWave) * 0.72;
          float contour = 1.0 - smoothstep(0.02, 0.12, abs(fract(vWave * 5.0 + 0.5) - 0.5));
          float sweep = pow(max(0.0, 0.5 + 0.5 * sin(vUv.x * 8.0 - uTime * 0.34 + vUv.y * 3.0)), 9.0);
          float shade = 0.18 + crest * 0.26 + sweep * 0.16 + contour * 0.08;
          vec3 graphite = mix(vec3(0.025,0.027,0.03), vec3(0.38,0.39,0.41), shade + line * 0.27);
          float edge = 1.0 - smoothstep(0.2, 0.8, length((vUv - 0.5) * vec2(1.0, 0.88)));
          float alpha = edge * (0.18 + line * 0.3 + crest * 0.16 + sweep * 0.12);
          gl_FragColor = vec4(graphite, alpha);
        }
      `,
    }))
    terrain.rotation.x = -0.92
    terrain.position.set(0, -1.2, -2.2)
    scene.add(terrain)

    const group = new THREE.Group()
    scene.add(group)
    const page = window.location.pathname.split('/').pop()?.replace('.html', '') || 'home'
    const geometryForPage = {
      home: () => new THREE.IcosahedronGeometry(1.28, 2),
      services: () => new THREE.OctahedronGeometry(1.28, 1),
      projects: () => new THREE.TorusKnotGeometry(1.04, 0.22, 144, 18, 2, 3),
      about: () => new THREE.DodecahedronGeometry(1.24, 1),
      approach: () => new THREE.IcosahedronGeometry(1.28, 2),
      contact: () => new THREE.TetrahedronGeometry(1.34, 1),
    }
    const orbGeometry = (geometryForPage[page] || geometryForPage.home)()
    const orbMaterial = new THREE.MeshPhysicalMaterial({
      color: '#3d4045', metalness: 0.92, roughness: 0.24,
      clearcoat: 1, clearcoatRoughness: 0.12,
      emissive: '#121315', emissiveIntensity: 0.4,
    })
    const orb = new THREE.Mesh(orbGeometry, orbMaterial)
    group.add(orb)

    const wire = new THREE.LineSegments(new THREE.EdgesGeometry(orbGeometry),
      new THREE.LineBasicMaterial({ color: '#d8dade', transparent: true, opacity: 0.3 }))
    group.add(wire)
    const shardMaterial = new THREE.MeshPhysicalMaterial({ color: '#292c31', metalness: 0.86, roughness: 0.22, clearcoat: 1 })
    const shardA = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), shardMaterial)
    shardA.position.set(-1.55, 0.8, 0.18)
    shardA.rotation.set(0.4, 0.2, 0.6)
    group.add(shardA)
    const shardB = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), shardMaterial.clone())
    shardB.position.set(1.48, -0.76, -0.26)
    shardB.rotation.set(0.1, 0.8, 0.2)
    group.add(shardB)

    const ringMaterial = new THREE.MeshBasicMaterial({ color: '#d0d3d8', transparent: true, opacity: 0.42, side: THREE.DoubleSide })
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.014, 6, 120), ringMaterial)
    ring.rotation.set(1.12, 0.25, -0.28)
    group.add(ring)
    const ringTwo = new THREE.Mesh(new THREE.TorusGeometry(2.08, 0.009, 6, 120), ringMaterial.clone())
    ringTwo.rotation.set(1.32, -0.42, 0.5)
    group.add(ringTwo)
    const ringThree = new THREE.Mesh(new THREE.TorusGeometry(2.32, 0.006, 6, 120), ringMaterial.clone())
    ringThree.rotation.set(0.35, 1.12, 0.25)
    group.add(ringThree)

    const ribbonPoints = Array.from({ length: 96 }, (_, i) => {
      const t = (i / 96) * Math.PI * 2
      return new THREE.Vector3(2.48 * Math.cos(t), 1.48 * Math.sin(t), 0.34 * Math.sin(2 * t))
    })
    const ribbonCurve = new THREE.CatmullRomCurve3(ribbonPoints, true, 'catmullrom', 0.35)
    const ribbon = new THREE.Mesh(new THREE.TubeGeometry(ribbonCurve, 140, 0.018, 5, true), new THREE.MeshPhysicalMaterial({ color: '#777b82', metalness: 0.88, roughness: 0.2, clearcoat: 1, transparent: true, opacity: 0.82 }))
    ribbon.rotation.set(0.72, -0.38, 0.22)
    group.add(ribbon)

    const orbitPoints = Array.from({ length: 96 }, (_, i) => {
      const t = (i / 96) * Math.PI * 2
      return new THREE.Vector3(1.25 * Math.cos(2 * t), 2.0 * Math.sin(t), 0.32 * Math.cos(3 * t))
    })
    const orbitCurve = new THREE.CatmullRomCurve3(orbitPoints, true, 'catmullrom', 0.3)
    const orbitRibbon = new THREE.Mesh(new THREE.TubeGeometry(orbitCurve, 140, 0.009, 4, true), new THREE.MeshBasicMaterial({ color: '#d5d7db', transparent: true, opacity: 0.48 }))
    orbitRibbon.rotation.set(-0.35, 0.82, 0.18)
    group.add(orbitRibbon)

    scene.add(new THREE.AmbientLight('#aeb2b8', 1.05))
    const keyLight = new THREE.PointLight('#f1f2f4', 48, 12)
    keyLight.position.set(-2.5, 2.7, 3.5)
    scene.add(keyLight)
    const rimLight = new THREE.PointLight('#747a82', 38, 10)
    rimLight.position.set(2.7, -1.2, -1.5)
    scene.add(rimLight)
    const edgeLight = new THREE.PointLight('#d1d4d8', 30, 10)
    edgeLight.position.set(0, -3, 2)
    scene.add(edgeLight)

    const starGeometry = new THREE.BufferGeometry()
    const starPositions = []
    for (let i = 0; i < 42; i += 1) {
      starPositions.push((Math.random() - 0.5) * 11, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 5 - 1)
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3))
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: '#c6c9ce', size: 0.012, transparent: true, opacity: 0.45 }))
    scene.add(stars)

    let frame = 0
    let pointerX = 0
    let pointerY = 0
    let scrollTarget = 0
    let scrollProgress = 0
    let lastFrameAt = 0
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const onPointerMove = (event) => {
      const rect = mount.getBoundingClientRect()
      pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.3
      pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.2
    }
    const resize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      if (!width || !height) return
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, getRenderScale()))
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    const onScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      scrollTarget = window.scrollY / maxScroll
    }
    mount.addEventListener('pointermove', onPointerMove)
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    const animate = (now) => {
      frame = requestAnimationFrame(animate)
      const frameInterval = window.innerWidth < 700 ? 33 : 24
      if (document.hidden || now - lastFrameAt < frameInterval) return
      lastFrameAt = now
      if (!reduceMotion) {
        scrollProgress += (scrollTarget - scrollProgress) * 0.035
        terrainUniforms.uTime.value += 0.008
        terrainUniforms.uScroll.value = scrollProgress
        group.rotation.y += (pointerX + 0.15 + scrollProgress * 2.2 - group.rotation.y) * 0.018
        group.rotation.x += (-pointerY + scrollProgress * 1.1 - group.rotation.x) * 0.018
        group.rotation.z = scrollProgress * 1.2
        shardA.rotation.x += 0.002 + scrollProgress * 0.004
        shardA.rotation.y += 0.003
        shardB.rotation.z -= 0.002 + scrollProgress * 0.004
        ring.rotation.z += 0.0012 + scrollProgress * 0.004
        ringTwo.rotation.z -= 0.0008 + scrollProgress * 0.003
        ringThree.rotation.y += 0.001 + scrollProgress * 0.003
        ribbon.rotation.y += 0.0008 + scrollProgress * 0.002
        orbitRibbon.rotation.x -= 0.0007 + scrollProgress * 0.0015
      }
      const isMobile = window.innerWidth < 700
      const heroFade = Math.max(0, 1 - scrollProgress * 1.8)
      group.scale.setScalar((isMobile ? 0.58 : 0.82) + scrollProgress * 0.42)
      group.position.x = isMobile ? 0 : 1.65 + scrollProgress * 0.62
      group.position.y = isMobile ? 0.04 - scrollProgress * 0.28 : 0.08 - scrollProgress * 0.62
      renderer.domElement.style.opacity = String(0.54 + scrollProgress * 0.12)
      renderer.domElement.style.setProperty('--hero-fade', String(heroFade))
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frame)
      mount.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      scene.traverse((object) => {
        object.geometry?.dispose()
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose())
        else object.material?.dispose()
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div className="orb-scene" ref={mountRef} aria-hidden="true"><div className="fallback-orb" /></div>
}
