import { lazy, Suspense, useEffect, useRef, useState } from 'react'

const ThreeOrb = lazy(() => import('./App.jsx').then((module) => ({ default: module.ThreeOrb })))

const services = [
  ['01','◈','Web design & development','Fast, polished websites that make a strong first impression and turn visitors into customers.'],
  ['02','✳','AI agents & automation','Practical AI assistants that answer questions, handle routine work, and give your team time back.'],
  ['03','⌁','Digital growth systems','Connected experiences and smart workflows that help your business serve more people, smoothly.'],
]
const nav = [['Home','#home'],['Services','#services'],['Pricing','#pricing'],['Projects','#projects'],['Approach','#approach'],['About','#about'],['Contact','#contact']]

function VoiceAssistant() {
  const [open, setOpen] = useState(() => window.innerWidth > 600 && !window.matchMedia('(pointer: coarse)').matches)
  const [listening, setListening] = useState(false)
  const [message, setMessage] = useState('Ask me about Cortexly, our websites, or AI agents.')
  const [supported, setSupported] = useState(true)
  const recognitionRef = useRef(null)

  const speak = (text, lang = 'en-IN') => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.96
    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    const greeting = 'Hi, I am the Cortexly assistant. Ask me anything about our company. We build websites and AI agents for small businesses, and I am here to answer your questions.'
    const timer = window.setTimeout(() => speak(greeting), 900)
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) setSupported(false)
    else {
      const recognition = new Recognition()
      // Keep recognition language independent from the browser's UI language.
      // Hindi/English reply language is selected from the recognized words below.
      recognition.lang = 'en-IN'
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      recognition.onresult = (event) => {
        const question = event.results[0][0].transcript
        const detectedLanguage = detectQuestionLanguage(question)
        const answer = companyAnswer(question)
        setMessage(`You asked: “${question}”\n\n${answer}`)
        speak(answer, detectedLanguage === 'hi' ? 'hi-IN' : 'en-IN')
        setListening(false)
      }
      recognition.onerror = () => { setListening(false); setMessage('I couldn’t hear that clearly. Please try again in English or Hindi.') }
      recognition.onend = () => setListening(false)
      recognitionRef.current = recognition
    }
    return () => {
      window.clearTimeout(timer)
      window.speechSynthesis?.cancel()
      recognitionRef.current?.stop()
    }
  }, [])

  const startConversation = () => {
    setOpen(true)
    if (!supported || !recognitionRef.current) {
      const unavailable = 'Voice questions are not supported in this browser. Try the latest Chrome or Edge, or explore the website sections.'
      setMessage(unavailable)
      speak(unavailable)
      return
    }
    try {
      recognitionRef.current.lang = 'en-IN'
      setMessage('Listening… Ask me about Cortexly in English or Hindi.')
      setListening(true)
      recognitionRef.current.start()
    } catch {
      setListening(false)
      setMessage('I am ready. Tap the microphone again to ask your question.')
    }
  }

  return <div className="voice-agent">
    {open && <div className="voice-panel" role="dialog" aria-label="Cortexly voice assistant"><div className="voice-panel-head"><span className="voice-orb">C</span><div><strong>Cortexly Assistant</strong><small>{listening ? 'Listening now' : 'Company information · Hindi & English'}</small></div><button className="voice-close" onClick={() => setOpen(false)} aria-label="Close assistant">×</button></div><p className="voice-message">{message}</p><button className={`voice-talk ${listening ? 'is-listening' : ''}`} onClick={startConversation}><span>{listening ? '●' : '🎙'}</span>{listening ? 'Listening…' : 'Ask in Hindi or English'}</button><small className="voice-hint">Your browser will ask permission to use the microphone.</small></div>}
    <button className="voice-launch" onClick={() => { setOpen((value) => !value); if (!open) speak('Hi, I am the Cortexly assistant. Ask me about our company in English or Hindi.') }} aria-label={open ? 'Close Cortexly assistant' : 'Open Cortexly assistant'} aria-expanded={open}><span className="voice-launch-icon">{open ? '×' : '◉'}</span><span>{open ? 'Close assistant' : 'Talk to Cortexly'}</span><i className="voice-live-dot" /></button>
  </div>
}

function detectQuestionLanguage(question) {
  const text = question.toLowerCase()
  if (/[\u0900-\u097f]/.test(text)) return 'hi'
  // Only clear Hindi/Hinglish wording switches the answer language. Common
  // English words such as "me", "to", and "or" must not cause false Hindi.
  const strongHindi = /\b(kya|ky|hai|hain|batao|bataiye|samjhao|samjhaiye|kitna|kitne|kitni|kaise|kaisa|kaisi|kyun|hota|hoti|hote|chahiye|karo|kren|kare|karta|karte|krte|kaam|accha|acha|thoda|wala|wali|waley|btao|bta|mein|mera|meri|mere|nahin|nahi|nhi|toh|aur|kr|kro|bhi)\b/g
  const strongCount = text.match(strongHindi)?.length || 0
  const HindiPhrase = /\b(ka|ki|ke)\s+(price|rate|cost|matlab|meaning|feature|features|detail|details)\b|\b(?:website|ecommerce|e-commerce|chatbot|agent|plan)\s+(?:me|mein)\s+(?:kya|kaise|kaisa|hota|hai)\b/.test(text)
  return strongCount > 0 || HindiPhrase ? 'hi' : 'en'
}

function companyAnswer(question) {
  const raw = question.toLowerCase()
  const q = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\u0900-\u097f\s]/g, ' ').replace(/\s+/g, ' ').trim()
  const has = (pattern) => pattern.test(q)
  const hindi = detectQuestionLanguage(question) === 'hi'
  const plans = {
    starter: {
      en:'Starter Website — ₹3k–₹6k. Best for a new or small business that needs a focused web presence. It includes a clean responsive page, your key business information, services, and a clear way for visitors to contact you. The final scope depends on the content and features you need.',
      hi:'Starter Website — ₹3k–₹6k। नए या छोटे business के लिए, जिसे एक focused online presence चाहिए। इसमें साफ़ और responsive page, ज़रूरी business जानकारी, services और visitors के contact करने का स्पष्ट तरीका शामिल है। Final scope आपके content और ज़रूरी features पर निर्भर करेगा.'
    },
    business: {
      en:'Business Website — ₹9k–₹18k. This is for a growing business that needs a fuller multi-section website. It covers a custom visual direction and dedicated space for your business, services, and key information. The final quote depends on the number of sections, content, and requested functionality.',
      hi:'Business Website — ₹9k–₹18k। बढ़ते business के लिए, जिसे कई sections वाली पूरी website चाहिए। इसमें custom visual direction और business, services तथा ज़रूरी जानकारी के लिए अलग sections शामिल हैं। Final quote sections की संख्या, content और functionality पर निर्भर करेगा.'
    },
    ecommerce: {
      en:'Pro / E-commerce Website — ₹22k–₹45k. This plan is for a business that wants to present products and sell online. It includes an online storefront, product catalogue presentation, and checkout/store features scoped to your needs. The final quote depends on catalogue size and payment, delivery, and other store requirements.',
      hi:'Pro / E-commerce Website — ₹22k–₹45k। उन businesses के लिए जो products दिखाकर online बेचना चाहते हैं। इसमें online storefront, product catalogue और आपकी ज़रूरत के अनुसार checkout/store features शामिल हैं। Final quote catalogue के size और payment, delivery तथा दूसरी store requirements पर निर्भर करेगा.'
    },
    chatbot: {
      en:'Basic Chatbot — ₹5k–₹10k. This is a focused website chatbot for frequently asked questions and essential business information. We shape its answers around the information you provide. Channels, content volume, and integrations affect the final scope.',
      hi:'Basic Chatbot — ₹5k–₹10k। यह website पर FAQs और ज़रूरी business जानकारी के जवाब देने वाला focused chatbot है। इसके जवाब आपके दिए हुए business information के अनुसार तैयार होते हैं। Channels, content की मात्रा और integrations से final scope तय होता है.'
    },
    smart: {
      en:'Smart Agent — ₹12k–₹18k. This is for richer, context-aware customer conversations using your business knowledge. Its scope includes preparing the knowledge it needs and shaping how it responds. The final quote depends on the knowledge sources, conversation needs, and integrations.',
      hi:'Smart Agent — ₹12k–₹18k। यह आपके business knowledge के आधार पर ज़्यादा detailed और context-aware conversations के लिए है। इसमें ज़रूरी knowledge तैयार करना और agent के जवाबों को shape करना शामिल है। Final quote knowledge sources, conversation needs और integrations पर निर्भर करेगा.'
    },
    action: {
      en:'Action Agent — from ₹22k. This plan is for an agent that does more than answer: it can carry out specific, agreed actions through connected workflows. The actions, systems it connects to, and safeguards are scoped for your requirements, so the final price depends on that setup.',
      hi:'Action Agent — ₹22k से शुरू। यह सिर्फ जवाब देने के बजाय तय किए गए काम connected workflows के ज़रिए कर सकता है। कौन-से actions करने हैं, किन systems से connect करना है और कौन-से safeguards चाहिए—इनके आधार पर scope और final price तय होते हैं.'
    },
  }
  const pick = (key) => plans[key][hindi ? 'hi' : 'en']
  if (has(/starter|स्टार्टर/)) return pick('starter')
  if (has(/business website|business plan|बिजनेस|व्यवसाय/)) return pick('business')
  if (has(/pro|e commerce|ecommerce|online store|shop|ई.?कॉमर्स|ऑनलाइन स्टोर/)) return pick('ecommerce')
  if (has(/basic chatbot|basic chat bot|chatbot|chat bot|चैट.?बॉट|चैटबॉट/)) return pick('chatbot')
  if (has(/smart agent|smart ai|intelligent agent|स्मार्ट एजेंट/)) return pick('smart')
  if (has(/action agent|action ai|agent that takes action|एक्शन एजेंट/)) return pick('action')

  if (has(/price|pricing|cost|budget|quote|how much|charge|rate|plan|package|tier|कितना|कीमत|प्राइस|प्लान|पैकेज/)) {
    if (has(/ai|agent|automation|chatbot|एआई|एजेंट|चैटबॉट/)) return hindi
      ? 'AI plans: Basic Chatbot ₹5k–₹10k, Smart Agent ₹12k–₹18k, और Action Agent ₹22k से शुरू। Basic Chatbot FAQs के जवाब देता है; Smart Agent business knowledge के साथ detailed conversations करता है; Action Agent connected workflows में तय actions कर सकता है। Final scope integrations और requirements के अनुसार तय होगा.'
      : 'AI plans: Basic Chatbot ₹5k–₹10k, Smart Agent ₹12k–₹18k, and Action Agent from ₹22k. The chatbot handles FAQs; the Smart Agent supports richer conversations using business knowledge; and the Action Agent can perform defined tasks in connected workflows. Final scope depends on integrations and requirements.'
    if (has(/web|website|development|design|site|वेबसाइट|वेब/)) return hindi
      ? 'Website plans: Starter ₹3k–₹6k, Business ₹9k–₹18k, और Pro / E-commerce ₹22k–₹45k। Starter focused online presence के लिए, Business multi-section company website के लिए, और Pro / E-commerce product catalogue तथा online selling के लिए है। Final quote pages और features पर निर्भर करेगा.'
      : 'Website plans: Starter ₹3k–₹6k, Business ₹9k–₹18k, and Pro / E-commerce ₹22k–₹45k. Starter is for a focused online presence, Business for a fuller multi-section site, and Pro / E-commerce for a catalogue and online selling. Final quotes depend on pages and features.'
    return hindi
      ? 'Website plans ₹3k–₹45k तक हैं और AI agent plans ₹5k–₹22k से शुरू होते हैं। Website में Starter, Business और Pro / E-commerce हैं; AI में Basic Chatbot, Smart Agent और Action Agent हैं। किसी एक plan का नाम बताएँ, तो मैं उसकी पूरी जानकारी दूँगा.'
      : 'Website plans range from ₹3k to ₹45k, and AI agent plans start at ₹5k. Website options are Starter, Business, and Pro / E-commerce; AI options are Basic Chatbot, Smart Agent, and Action Agent. Name a plan and I can explain its details.'
  }
  if (has(/approach|process|steps|workflow|how do you work|how you work|develop|development process|build process|तरीका|प्रक्रिया|कैसे बनाते|कैसे काम/)) return hindi
    ? 'हम चार steps में काम करते हैं। पहले आपके business, customers, goals और challenges समझते हैं। फिर scope, features, design और technology तय करके milestones बनाते हैं। तीसरे step में आपके feedback के साथ design और development करते हैं। आखिर में experience test करके launch करते हैं और आगे के improvements पहचानते हैं.'
    : 'Our approach has four steps. First, we understand your business, customers, goals, and challenges. Second, we shape the scope, experience, features, and technology with clear milestones. Third, we design and build in focused steps, checking in with you as we go. Finally, we test and launch, then identify improvements as your business grows.'
  if (has(/founder|ayush|who made|who started|owner|किसने शुरू|फाउंडर|संस्थापक/)) return hindi ? 'Cortexly के founder Mr. Ayush Verma हैं। Cortexly छोटे businesses के लिए websites और AI agents बनाता है।' : 'Cortexly was founded by Mr. Ayush Verma. We help small businesses with websites and AI agents.'
  if (has(/location|where|kanpur|remote|based|कहाँ|कहां|लोकेशन|स्थान/)) return hindi ? 'Cortexly remote तरीके से Kanpur, Uttar Pradesh से काम करता है।' : 'Cortexly works remotely from Kanpur, Uttar Pradesh.'
  if (has(/contact|email|reach|talk|hire|start a project|get in touch|संपर्क|ईमेल|बात करना/)) return hindi ? 'Contact section से enquiry भेजें। Form आपके लिए ayushverma1753@gmail.com पर Gmail draft तैयार करता है; आप उसे review करके Send कर सकते हैं। वहीं WhatsApp contact भी दिया है।' : 'Use the Contact section to start an enquiry. The form prepares a Gmail draft to ayushverma1753@gmail.com for you to review and send. A WhatsApp contact is listed there too.'
  if (has(/service|services|offer|what do you do|सेवा|क्या करते/)) return hindi ? 'Cortexly websites, AI agents और automation, तथा digital growth systems बनाता है—छोटे businesses की ज़रूरत के अनुसार।' : 'Cortexly builds websites, AI agents and automations, and digital growth systems for small businesses.'
  if (hindi) return 'मैं Cortexly के plans, features, services और काम करने के तरीके के बारे में बता सकता हूँ। किसी plan का नाम पूछें—जैसे Starter, Business, Pro E-commerce, Basic Chatbot, Smart Agent या Action Agent।'
  return 'I can explain Cortexly’s plans, features, services, and approach. Ask about a plan by name—such as Starter, Business, Pro E-commerce, Basic Chatbot, Smart Agent, or Action Agent.'
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  return <header className="site-header"><div className="wrap nav"><a className="brand" href="#home" aria-label="Cortexly home"><img className="brand-symbol" src="/cortexly-icon.svg" alt="" width="32" height="32" />cortexly</a><nav id="mobile-navigation" className={`nav-links ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">{nav.map(([label,href])=><a key={label} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}</nav><button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-controls="mobile-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span/><span/><span/></button><a className="nav-cta" href="#contact" onClick={() => setMenuOpen(false)}>Let’s talk <span>↗</span></a></div></header>
}

function Hero() {
  return <section id="home" className="wrap hero home-hero"><div className="hero-copy-wrap"><div className="eyebrow">Digital studio for what’s next</div><h1><span className="h-grad">Small business.</span><br/>Big possibility.</h1><p className="hero-copy">Thoughtful websites and practical AI agents to help small businesses look sharper, work smarter, and grow with confidence.</p><div className="hero-actions"><a className="button" href="#contact">Build something better <span>↗</span></a><a className="text-link" href="#approach">How we work <span>↓</span></a></div><div className="home-proof"><span>Websites</span><i/><span>AI agents</span><i/><span>Digital systems</span></div></div><div className="hero-visual"><div className="visual-grid"/><div className="orbit2"/><div className="float-card card-ai"><strong><span className="status"/>AI agents</strong>Less busywork. More momentum.</div><div className="float-card card-web"><strong>Digital presence</strong>Made to move your business.</div></div></section>
}

function Services() {
  return <section id="services" className="wrap section standalone-page"><div className="eyebrow">What we do</div><h2 className="page-title">Digital tools that<br/><span className="h-grad">move you forward.</span></h2><p className="page-lede">A focused set of services to help your business show up clearly and work more efficiently.</p><div className="services">{services.map(([number,icon,title,body])=><article className="service" key={number}><span className="service-no">{number}</span><div className="service-icon">{icon}</div><h3>{title}</h3><p>{body}</p></article>)}</div></section>
}

const webPlans = [
  { name:'Starter', price:'₹3k – ₹6k', note:'A clean, professional starting point for a new or small business.', features:['Focused business presence','Responsive page design','Essential contact details'] },
  { name:'Business', price:'₹9k – ₹18k', note:'A polished, more complete website for a growing business.', features:['Multi-section business website','Custom visual direction','Space for services and business information'], featured:true },
  { name:'Pro / E-commerce', price:'₹22k – ₹45k', note:'A product-ready online store, scoped around your catalogue.', features:['E-commerce storefront','Product and catalogue presentation','Checkout and store features scoped to your needs'] },
]
const aiPlans = [
  { name:'Basic Chatbot', price:'₹5k – ₹10k', note:'A helpful chatbot for common customer questions.', features:['Frequently asked questions','Business information responses','Website chat experience'] },
  { name:'Smart Agent', price:'₹12k – ₹18k', note:'A smarter assistant for detailed, knowledge-led conversations.', features:['Context-aware conversations','Business knowledge responses','Workflow and integration scope defined with you'], featured:true },
  { name:'Action Agent', price:'From ₹22k', note:'An agent built to carry out defined actions in connected workflows.', features:['Task-oriented conversations','Connected actions scoped to requirements','Automation workflow planning'] },
]

function PlanCards({ plans }) {
  return <div className="pricing-grid">{plans.map((plan) => <article className={`price-card ${plan.featured ? 'featured' : ''}`} key={plan.name}>{plan.featured && <span className="popular-tag">POPULAR CHOICE</span>}<h4>{plan.name}</h4><strong className="plan-price">{plan.price}</strong><p>{plan.note}</p><ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><a href="#contact" className="plan-link">Discuss this plan <span>↗</span></a></article>)}</div>
}

function Pricing() {
  return <section id="pricing" className="wrap section pricing-section"><div className="eyebrow">Straightforward pricing</div><h2 className="page-title">The right tools.<br/><span className="h-grad">A clear investment.</span></h2><p className="page-lede">Pick a plan to get started. We’ll confirm the scope and final quote around your requirements.</p><div className="pricing-category"><div className="pricing-category-heading"><span className="service-icon">◈</span><div><span className="pricing-kicker">DESIGN · DEVELOPMENT · STORES</span><h3>Website development</h3><p>Professional websites for businesses at every stage.</p></div></div><PlanCards plans={webPlans}/></div><div className="pricing-category"><div className="pricing-category-heading"><span className="service-icon">✳</span><div><span className="pricing-kicker">CHAT · KNOWLEDGE · AUTOMATION</span><h3>AI agents</h3><p>From helpful answers to action-taking business workflows.</p></div></div><PlanCards plans={aiPlans}/></div><p className="pricing-note">All prices are in INR. Final pricing depends on scope, content, features, and integrations.</p></section>
}

function ProjectArt({variant,title}) {
  return <div className={`project-art ${variant}`} aria-hidden="true"><div className="mock-window"><div className="mock-bar"/><div className="mock-title">{title}</div><div className="mock-line"/><div className="mock-cta"/><div className="mock-shape"/></div></div>
}

function Projects() {
  return <section id="projects" className="wrap section standalone-page"><div className="eyebrow">Projects</div><h2 className="page-title">Real projects.<br/><span className="h-grad">Real momentum.</span></h2><p className="page-lede">Explore these live projects and see each business in its own digital space.</p><div className="projects"><a className="project" href="https://www.iftnext.com" target="_blank" rel="noopener noreferrer"><ProjectArt variant="art-one" title="Building what comes next."/><div className="project-meta"><span className="work-label">Live project · Web experience</span><h3>IFT Next</h3><p>Visit the live website to explore the project.</p></div><span className="project-arrow">↗</span></a><a className="project" href="https://www.architectureroxx.in" target="_blank" rel="noopener noreferrer"><ProjectArt variant="art-two" title="Space for better living."/><div className="project-meta"><span className="work-label">Live project · Architecture</span><h3>Architecture Roxx</h3><p>Visit the live website to explore the project.</p></div><span className="project-arrow">↗</span></a></div></section>
}

function Approach() {
  const steps=[['01','Understand the business','We start with your customers, goals, and day-to-day challenges.'],['02','Shape the right plan','We define the experience, features, and technology with clear milestones.'],['03','Design and build','We create the visual system and develop the website or AI workflow in focused steps.'],['04','Launch and improve','We prepare the experience for launch and identify useful next improvements.']]
  return <section id="approach" className="wrap section standalone-page"><div className="eyebrow">The Cortexly approach</div><h2 className="page-title">Thoughtful by design.<br/><span className="h-grad">Useful by nature.</span></h2><p className="page-lede">A collaborative process keeps decisions clear and the work connected to the outcomes your business needs.</p><div className="approach-grid">{steps.map(([n,title,body])=><article className="approach-step" key={n}><span>{n}</span><h3>{title}</h3><p>{body}</p></article>)}</div><div className="approach-principles"><div className="eyebrow">What guides us</div><h3>Technology should feel human.</h3><p>We choose tools for the job they do, keep the experience easy to understand, and build with care for the people who use them.</p></div></section>
}

function About() {
  return <section id="about" className="wrap section standalone-page about-page"><div className="about-copy"><div className="eyebrow">Meet the founder</div><h2 className="page-title">Personal thinking.<br/><span className="h-grad">Practical outcomes.</span></h2><p>Cortexly is a digital studio founded by Mr. Ayush Verma to help small businesses make the most of the web and AI. We pair thoughtful design with useful technology, keeping each project focused on the people it serves and the goals that matter.</p></div><div className="founder-card"><div className="founder-top founder-name-only"><h3>Mr. Ayush Verma</h3><div className="role">Founder, Cortexly</div></div><p className="founder-note">“Good technology should feel clear, human, and genuinely useful. That’s the standard we bring to every project.”</p></div></section>
}

function Contact() {
  const [sentName,setSentName]=useState('')
  const handleSubmit=(event)=>{
    event.preventDefault()
    const form=new FormData(event.currentTarget)
    const name=form.get('name').trim()
    const subject=encodeURIComponent(`Project enquiry from ${name}`)
    const body=encodeURIComponent(`Hello Cortexly,\n\nI would like to discuss a project.\n\nName: ${name}\nEmail: ${form.get('email')}\nBusiness: ${form.get('business') || 'Not provided'}\nService: ${form.get('service')}\n\nProject details:\n${form.get('message')}\n\nRegards,\n${name}`)
    const gmailCompose = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent('ayushverma1753@gmail.com')}&su=${subject}&body=${body}`
    window.open(gmailCompose, '_blank', 'noopener,noreferrer')
    setSentName(name)
  }
  return <section id="contact" className="wrap section contact-page"><div className="contact-intro"><div className="eyebrow">Get in touch</div><h2 className="page-title">Let’s make your<br/><span className="h-grad">next move.</span></h2><p>Tell us what you’re building. Share a few details and we’ll get back to you with a thoughtful next step.</p><div className="contact-direct"><span>Studio location</span><strong>Remote · Kanpur, Uttar Pradesh</strong><span>Email us</span><a href="mailto:ayushverma1753@gmail.com">ayushverma1753@gmail.com</a><span>WhatsApp</span><a href="https://wa.me/916386632021" target="_blank" rel="noopener noreferrer">Chat on WhatsApp · +91 63866 32021 ↗</a></div></div><form className="contact-form" onSubmit={handleSubmit}><div className="form-heading"><span>PROJECT ENQUIRY</span><p>Tell us a little about your business and what you need.</p></div><div className="form-row"><label>Your name<input name="name" autoComplete="name" placeholder="e.g. Alex Morgan" required/></label><label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@company.com" required/></label></div><div className="form-row"><label>Business name <span className="optional">Optional</span><input name="business" autoComplete="organization" placeholder="Your business"/></label><label>What do you need?<select name="service" defaultValue="Website design & development"><option>Website design & development</option><option>AI agent or automation</option><option>Digital strategy</option><option>Something else</option></select></label></div><label>Tell us about your project<textarea name="message" rows="5" placeholder="What are you looking to build or improve?" required/></label><button className="button form-submit" type="submit">Open enquiry in Gmail <span>↗</span></button><p className="form-privacy">Your enquiry opens as a prefilled Gmail draft to ayushverma1753@gmail.com. Review it and press Send in Gmail.</p>{sentName&&<div className="form-success" role="status"><strong>Thank you, {sentName}.</strong><span>Your enquiry draft is ready in Gmail. Review the details and press Send—we’ll be in touch soon.</span></div>}</form></section>
}

function Footer() {
  return <footer className="wrap footer"><a className="brand" href="#home"><img className="brand-symbol" src="/cortexly-icon.svg" alt="" width="26" height="26"/>cortexly</a><span>© {new Date().getFullYear()} Cortexly Studio. Built for what’s next.</span><a href="#home">Back to top ↑</a></footer>
}

function App() {
  return <><Suspense fallback={<div className="orb-scene" aria-hidden="true"/>}><ThreeOrb/></Suspense><div className="noise"/><Header/><main><Hero/><Services/><Pricing/><Projects/><Approach/><About/><Contact/></main><Footer/><VoiceAssistant/></>
}

export default App


