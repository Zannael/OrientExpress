import { useEffect, useMemo, useState } from 'react'

const CATEGORIE = {
  manga: {
    label: 'Manga / libro fisico',
    iva: 4,
    dazio: 0,
    nota: 'In genere IVA ridotta al 4% e dazio 0%.',
  },
  figure: {
    label: 'Action figure',
    iva: 22,
    dazio: 4.7,
    nota: 'Caso tipico: IVA 22% e dazio intorno al 4,7%.',
  },
  console: {
    label: 'Console',
    iva: 22,
    dazio: 0,
    nota: 'Di norma IVA 22% e dazio 0%, ma logistica piu costosa.',
  },
  videogioco: {
    label: 'Videogioco fisico',
    iva: 22,
    dazio: 0,
    nota: 'Di norma IVA 22% e dazio 0%.',
  },
  altro: {
    label: 'Altro',
    iva: 22,
    dazio: 2,
    nota: 'Controlla sempre la classificazione TARIC reale del prodotto.',
  },
}

const euro = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
})

const puntiChiave = [
  'Il costo reale dipende da 5 blocchi: fee proxy, spedizione in Giappone, spedizione internazionale, fiscalita, fee corriere.',
  'IVA non sempre al 22%: per manga/libri fisici puo applicarsi il 4%.',
  'Sotto 150 euro oggi niente dazio percentuale, ma dal 1 luglio 2026 e prevista una quota fissa da 3 euro sui piccoli pacchi e-commerce.',
  'Per console e hardware la variabile decisiva e spesso la logistica (batterie, corriere premium, handling), non il dazio.',
]

const proxy = [
  {
    nome: 'ZenMarket',
    forza: 'Scelta equilibrata per l Italia',
    dettagli: 'Prevedibile su costo atterrato e gestione IVA anticipata per spedizioni UE idonee.',
    link: 'https://zenmarket.jp/it/',
  },
  {
    nome: 'Neokyo',
    forza: 'Ottimo controllo logistico',
    dettagli: 'Molto trasparente su packing, batterie e metodi di spedizione per hardware.',
    link: 'https://neokyo.com/it',
  },
  {
    nome: 'Buyee',
    forza: 'Molto semplice da usare',
    dettagli: 'Buono su partner e flusso d acquisto, ma attenzione alla copertura su elettronica usata.',
    link: 'https://buyee.jp/?lang=en',
  },
  {
    nome: 'FROM JAPAN, Sendico e Doorzo',
    forza: 'Alternative valide per casi specifici',
    dettagli: 'Buone in nicchie diverse (collezionismo, accumulo ordini, fee basse) con diversi livelli di trasparenza.',
    links: [
      { label: 'FROM JAPAN', url: 'https://www.fromjapan.co.jp/en/' },
      { label: 'Sendico', url: 'https://sendico.com/' },
      { label: 'Doorzo', url: 'https://www.doorzo.com/it' },
    ],
  },
]

const formule = [
  'B = (prezzo articolo + fee proxy + spedizione in Giappone + optional) x cambio',
  'L = (spedizione internazionale + assicurazione/imballo) x cambio',
  'CV = B + L',
  'Dazio = 0 sotto 150 euro (oggi), oppure quota fissa 3 euro nel regime luglio 2026; sopra 150 euro usa aliquota TARIC',
  'IVA = aliquota x (CV + dazio)',
  'Totale = CV + dazio + IVA + fee accessorie',
]

function numero(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function yenToNumber(value) {
  const onlyDigits = String(value || '').replace(/[^\d]/g, '')
  if (!onlyDigits) {
    return null
  }
  const amount = Number(onlyDigits)
  return Number.isFinite(amount) ? amount : null
}

function sourceLabel(source) {
  if (source === 'zenmarket') {
    return 'ZenMarket'
  }
  if (source === 'neokyo') {
    return 'Neokyo'
  }
  if (source === 'buyee') {
    return 'Buyee'
  }
  if (source === 'fromjapan') {
    return 'FROM JAPAN'
  }
  return source || 'Sito esterno'
}

function HomePage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#fff8e9_0%,_#f7fbff_34%,_#f4f7fb_100%)] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
          <p className="font-['DM_Serif_Display',serif] text-xl tracking-wide">JapanBuy Italia</p>
          <a
            href="/dashboard"
            className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            Vai alla dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <section className="rounded-3xl border border-amber-200/70 bg-white/95 p-7 shadow-xl shadow-amber-100/40 sm:p-10">
          <p className="inline-flex rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-900">
            Risultati ricerca
          </p>
          <h1 className="mt-4 max-w-4xl font-['DM_Serif_Display',serif] text-4xl leading-tight sm:text-6xl">
            Importare dal Giappone in Italia: cosa conviene davvero e come stimare il costo finale
          </h1>
          <p className="mt-5 max-w-3xl text-slate-700 sm:text-lg">
            Questa pagina sintetizza la ricerca completa nel file `deep-research-report.md`: proxy
            consigliati, fiscalita aggiornata, logistica e formula operativa per stimare il prezzo
            reale di arrivo in Italia.
          </p>
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-2">
          {puntiChiave.map((punto) => (
            <article
              key={punto}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5"
            >
              <p className="text-sm leading-relaxed text-slate-700">{punto}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
          <h2 className="font-['DM_Serif_Display',serif] text-3xl">Proxy consigliati</h2>
          <p className="mt-2 text-slate-700">
            Non esiste il proxy perfetto in assoluto: la scelta cambia in base al tipo di bene,
            livello di rischio e modalita di spedizione.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {proxy.map((item) => (
              <article key={item.nome} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-lg font-bold text-slate-900">{item.nome}</p>
                <p className="mt-1 text-sm font-semibold text-amber-700">{item.forza}</p>
                <p className="mt-2 text-sm text-slate-700">{item.dettagli}</p>
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-sm font-semibold text-blue-700 underline decoration-blue-300 underline-offset-4 hover:text-blue-800"
                  >
                    Visita sito ufficiale
                  </a>
                ) : null}
                {item.links ? (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {item.links.map((sito) => (
                      <a
                        key={sito.label}
                        href={sito.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-blue-700 underline decoration-blue-300 underline-offset-4 hover:text-blue-800"
                      >
                        {sito.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-7">
            <h2 className="font-['DM_Serif_Display',serif] text-3xl">Fiscalita in pratica</h2>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-700">
              <li>IVA standard 22%, ma per manga/libri fisici si usa spesso il 4%.</li>
              <li>
                Oggi: sotto 150 euro niente dazio percentuale. Sopra 150 euro: dazio secondo codice
                TARIC.
              </li>
              <li>
                Dal 1 luglio 2026: sui piccoli pacchi e-commerce sotto 150 euro entra una quota
                forfettaria da 3 euro.
              </li>
              <li>
                In Italia va considerato anche il contributo da modico valore e le fee di
                sdoganamento del corriere.
              </li>
            </ul>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-7">
            <h2 className="font-['DM_Serif_Display',serif] text-3xl">Spedizione dal Giappone</h2>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-700">
              <li>Manga e giochi leggeri: ePacket/Airmail/SAL possono essere molto competitivi.</li>
              <li>Figure di valore: meglio imballo rinforzato, foto controllo e tracking solido.</li>
              <li>
                Console con batterie: spesso servono corrieri privati (DHL/UPS/FedEx), con costo
                totale sensibilmente piu alto.
              </li>
              <li>
                Documentazione precisa (descrizione + codici) riduce ritardi e problemi in dogana.
              </li>
            </ul>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
          <h2 className="font-['DM_Serif_Display',serif] text-3xl">Formula di stima operativa</h2>
          <p className="mt-2 text-slate-700">
            La ricerca suggerisce una formula modulare, non il semplice "prezzo x 1,22".
          </p>
          <div className="mt-5 grid gap-3">
            {formule.map((formula) => (
              <div key={formula} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <code className="text-sm text-slate-800">{formula}</code>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Strategia finale: scegli il proxy che riduce incertezza fiscale e logistica sul tuo tipo
            di prodotto, non quello con la fee piu bassa in assoluto.
          </div>
        </section>
      </main>
    </div>
  )
}

function DashboardPage() {
  const [categoria, setCategoria] = useState('figure')
  const [nomeProdotto, setNomeProdotto] = useState('Nintendo Switch OLED usata')
  const [regime, setRegime] = useState('oggi')
  const [ioss, setIoss] = useState(false)
  const [prodottoUrl, setProdottoUrl] = useState('')
  const [scrapeLoading, setScrapeLoading] = useState(false)
  const [scrapeError, setScrapeError] = useState('')
  const [scrapedData, setScrapedData] = useState(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [form, setForm] = useState({
    prezzoArticolo: 23000,
    feeProxy: 500,
    spedizioneGiappone: 900,
    optionalProxy: 0,
    spedizioneInternazionale: 5800,
    assicurazioneImballo: 700,
    tassoYenEuro: 0.0062,
    ivaPercento: CATEGORIE.figure.iva,
    dazioPercento: CATEGORIE.figure.dazio,
    feeCorriere: 8,
    contributoItalia: 2,
    feeCambio: 1.5,
  })

  const risultati = useMemo(() => {
    const prezzoArticolo = numero(form.prezzoArticolo)
    const feeProxy = numero(form.feeProxy)
    const spedizioneGiappone = numero(form.spedizioneGiappone)
    const optionalProxy = numero(form.optionalProxy)
    const spedizioneInternazionale = numero(form.spedizioneInternazionale)
    const assicurazioneImballo = numero(form.assicurazioneImballo)
    const tassoYenEuro = numero(form.tassoYenEuro)
    const ivaPercento = numero(form.ivaPercento)
    const dazioPercento = numero(form.dazioPercento)
    const feeCorriere = numero(form.feeCorriere)
    const contributoItalia = numero(form.contributoItalia)
    const feeCambio = numero(form.feeCambio)

    const baseYen = prezzoArticolo + feeProxy + spedizioneGiappone + optionalProxy
    const logisticaYen = spedizioneInternazionale + assicurazioneImballo
    const baseEuro = baseYen * tassoYenEuro
    const logisticaEuro = logisticaYen * tassoYenEuro
    const valoreIntrinseco = baseEuro
    const valoreDoganale = baseEuro + logisticaEuro

    let dazio = 0
    if (valoreIntrinseco > 150) {
      dazio = valoreDoganale * (dazioPercento / 100)
    } else if (regime === 'luglio2026') {
      dazio = 3
    }

    const iva = ioss ? 0 : (valoreDoganale + dazio) * (ivaPercento / 100)
    const accessori = feeCorriere + contributoItalia + feeCambio
    const totale = valoreDoganale + dazio + iva + accessori
    const prezzoArticoloEuro = prezzoArticolo * tassoYenEuro
    const commissioniGiapponeEuro = (feeProxy + spedizioneGiappone + optionalProxy) * tassoYenEuro
    const sovrapprezzoTotale = totale - prezzoArticoloEuro

    return {
      prezzoArticoloEuro,
      commissioniGiapponeEuro,
      baseEuro,
      logisticaEuro,
      valoreIntrinseco,
      valoreDoganale,
      dazio,
      iva,
      accessori,
      totale,
      sovrapprezzoTotale,
    }
  }, [form, regime, ioss])

  const aggiornaCampo = (chiave, valore) => {
    setForm((prev) => ({ ...prev, [chiave]: valore }))
  }

  const cambiaCategoria = (valore) => {
    setCategoria(valore)
    setForm((prev) => ({
      ...prev,
      ivaPercento: CATEGORIE[valore].iva,
      dazioPercento: CATEGORIE[valore].dazio,
    }))
  }

  const importaDalLink = async () => {
    setScrapeError('')
    setScrapedData(null)
    setViewerOpen(false)
    setViewerIndex(0)

    let normalizedUrl
    try {
      normalizedUrl = new URL(prodottoUrl)
    } catch {
      setScrapeError('Inserisci un URL valido (es. https://...)')
      return
    }

    setScrapeLoading(true)
    try {
      const response = await fetch(`/api/scrape-product?url=${encodeURIComponent(normalizedUrl.toString())}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Impossibile leggere la pagina prodotto')
      }

      setScrapedData(data)
      if (data.title) {
        setNomeProdotto(data.title)
      }

      const importedYen = yenToNumber(data?.price?.yen)
      if (importedYen) {
        setForm((prev) => ({ ...prev, prezzoArticolo: importedYen }))
      }
    } catch (error) {
      setScrapeError(error.message || 'Errore durante lo scraping')
    } finally {
      setScrapeLoading(false)
    }
  }

  const immaginiProdotto = (scrapedData?.images || []).filter(Boolean)

  const apriViewer = (index) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }

  const chiudiViewer = () => setViewerOpen(false)

  const prossimaImmagine = () => {
    if (!immaginiProdotto.length) {
      return
    }
    setViewerIndex((prev) => (prev + 1) % immaginiProdotto.length)
  }

  const immaginePrecedente = () => {
    if (!immaginiProdotto.length) {
      return
    }
    setViewerIndex((prev) => (prev - 1 + immaginiProdotto.length) % immaginiProdotto.length)
  }

  useEffect(() => {
    if (!viewerOpen) {
      return undefined
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        chiudiViewer()
      }
      if (event.key === 'ArrowRight') {
        prossimaImmagine()
      }
      if (event.key === 'ArrowLeft') {
        immaginePrecedente()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [viewerOpen, immaginiProdotto.length])

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#eef6ff_0%,_#f6f8fc_100%)] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
          <p className="font-['DM_Serif_Display',serif] text-xl tracking-wide">Dashboard calcolatore</p>
          <a
            href="/"
            className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          >
            Torna al report
          </a>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-8 lg:grid-cols-[1fr_1.05fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-300/20 sm:p-8">
          <h1 className="font-['DM_Serif_Display',serif] text-4xl leading-tight">Calcolo prezzo finale</h1>
          <p className="mt-2 text-sm text-slate-700">
            Inserisci i parametri reali del tuo ordine e simula il costo di arrivo in Italia.
          </p>

          <div className="mt-5 grid gap-4">
            <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4">
              <p className="text-sm font-semibold text-blue-900">Import automatico dal link prodotto</p>
              <p className="mt-1 text-xs text-blue-800">
                Incolla un link ZenMarket, Neokyo o Buyee: importeremo immagini e dettagli utili.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  value={prodottoUrl}
                  onChange={(e) => setProdottoUrl(e.target.value)}
                  placeholder="https://zenmarket.jp/... oppure https://neokyo.com/..."
                  className="w-full rounded-xl border border-blue-300 bg-white px-3 py-2 text-sm outline-none ring-blue-300 transition focus:ring"
                />
                <button
                  type="button"
                  onClick={importaDalLink}
                  disabled={scrapeLoading}
                  className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {scrapeLoading ? 'Importazione...' : 'Importa dal link'}
                </button>
              </div>
              {scrapeError ? <p className="mt-2 text-xs text-red-700">{scrapeError}</p> : null}
            </div>

            {scrapedData ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Dati importati da {sourceLabel(scrapedData.source)}
                </p>
                <h3 className="mt-1 text-base font-bold text-slate-900">{scrapedData.title || 'Prodotto'}</h3>
                <div className="mt-2 grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
                  <p>
                    <strong>Prezzo:</strong> {scrapedData?.price?.yen || 'N/D'}
                  </p>
                  <p>
                    <strong>Convertito:</strong> {scrapedData?.price?.converted || 'N/D'}
                  </p>
                  <p>
                    <strong>Venditore:</strong> {scrapedData?.seller?.name || 'N/D'}
                  </p>
                  <p>
                    <strong>Condizione:</strong> {scrapedData?.item?.condition || 'N/D'}
                  </p>
                  <p>
                    <strong>ID:</strong> {scrapedData?.item?.id || 'N/D'}
                  </p>
                  <p>
                    <strong>Spedizione interna:</strong> {scrapedData?.item?.domesticShipping || scrapedData?.item?.shippingPaidBy || 'N/D'}
                  </p>
                </div>
                {immaginiProdotto.length ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => apriViewer(0)}
                      className="group relative block w-full overflow-hidden rounded-xl border border-slate-200 bg-white"
                    >
                      <img
                        src={immaginiProdotto[0]}
                        alt="Immagine principale prodotto"
                        className="h-52 w-full object-cover transition duration-300 group-hover:scale-[1.02] sm:h-64"
                        loading="lazy"
                      />
                      <span className="absolute bottom-2 right-2 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white">
                        Apri galleria ({immaginiProdotto.length})
                      </span>
                    </button>

                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                      {immaginiProdotto.map((imgUrl, idx) => (
                        <button
                          key={imgUrl}
                          type="button"
                          onClick={() => apriViewer(idx)}
                          className="shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white"
                        >
                          <img
                            src={imgUrl}
                            alt={`Anteprima ${idx + 1}`}
                            className="h-16 w-16 object-cover sm:h-20 sm:w-20"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">Nessuna immagine disponibile per questa pagina.</p>
                )}
              </div>
            ) : null}

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-800">Nome prodotto</span>
              <input
                value={nomeProdotto}
                onChange={(e) => setNomeProdotto(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-amber-300 transition focus:ring"
                placeholder="Es. New Nintendo 3DS XL"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-slate-800">Categoria</span>
                <select
                  value={categoria}
                  onChange={(e) => cambiaCategoria(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-amber-300 transition focus:ring"
                >
                  {Object.entries(CATEGORIE).map(([chiave, item]) => (
                    <option key={chiave} value={chiave}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium text-slate-800">Regime</span>
                <select
                  value={regime}
                  onChange={(e) => setRegime(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-amber-300 transition focus:ring"
                >
                  <option value="oggi">Regole attuali</option>
                  <option value="luglio2026">Simulazione luglio 2026</option>
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['prezzoArticolo', 'Prezzo articolo (JPY)'],
                ['feeProxy', 'Commissione proxy (JPY)'],
                ['spedizioneGiappone', 'Spedizione interna Giappone (JPY)'],
                ['optionalProxy', 'Optional proxy (JPY)'],
                ['spedizioneInternazionale', 'Spedizione internazionale (JPY)'],
                ['assicurazioneImballo', 'Assicurazione/imballo (JPY)'],
                ['tassoYenEuro', 'Cambio effettivo (1 JPY in EUR)'],
                ['ivaPercento', 'Aliquota IVA (%)'],
                ['dazioPercento', 'Aliquota dazio (%)'],
                ['feeCorriere', 'Fee corriere/disbrigo (EUR)'],
                ['contributoItalia', 'Contributo italiano (EUR)'],
                ['feeCambio', 'Commissione pagamento (EUR)'],
              ].map(([chiave, etichetta]) => (
                <label key={chiave} className="grid gap-1 text-sm">
                  <span className="font-medium text-slate-800">{etichetta}</span>
                  <input
                    type="number"
                    step={chiave === 'tassoYenEuro' ? '0.0001' : '0.1'}
                    value={form[chiave]}
                    onChange={(e) => aggiornaCampo(chiave, e.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-amber-300 transition focus:ring"
                  />
                </label>
              ))}
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={ioss}
                onChange={(e) => setIoss(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300"
              />
              <span>IVA prepagata con IOSS (IVA importazione impostata a zero)</span>
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-300/20 sm:p-8">
          <p className="inline-flex rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-900">
            Risultato simulazione
          </p>
          <h2 className="mt-3 font-['DM_Serif_Display',serif] text-3xl">{nomeProdotto || 'Prodotto non specificato'}</h2>
          <p className="mt-2 text-sm text-slate-700">{CATEGORIE[categoria].nota}</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Totale stimato</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{euro.format(risultati.totale)}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prezzo solo articolo</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{euro.format(risultati.prezzoArticoloEuro)}</p>
            </article>
            <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Quanto paghi in piu</p>
              <p className="mt-1 text-3xl font-bold text-amber-900">{euro.format(risultati.sovrapprezzoTotale)}</p>
            </article>
          </div>

          <ul className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <li className="flex items-center justify-between gap-4">
              <span>Prezzo prodotto (solo articolo)</span>
              <strong>{euro.format(risultati.prezzoArticoloEuro)}</strong>
            </li>
            <li className="flex items-center justify-between gap-4">
              <span>Commissioni e costi in Giappone (proxy + sped. interna + optional)</span>
              <strong>{euro.format(risultati.commissioniGiapponeEuro)}</strong>
            </li>
            <li className="flex items-center justify-between gap-4">
              <span>Subtotale fase Giappone (B)</span>
              <strong>{euro.format(risultati.baseEuro)}</strong>
            </li>
            <li className="flex items-center justify-between gap-4">
              <span>Spedizione internazionale + assicurazione (L)</span>
              <strong>{euro.format(risultati.logisticaEuro)}</strong>
            </li>
            <li className="flex items-center justify-between gap-4">
              <span>Valore doganale stimato (CV = B + L)</span>
              <strong>{euro.format(risultati.valoreDoganale)}</strong>
            </li>
            <li className="flex items-center justify-between gap-4">
              <span>Dazio doganale</span>
              <strong>{euro.format(risultati.dazio)}</strong>
            </li>
            <li className="flex items-center justify-between gap-4">
              <span>IVA importazione</span>
              <strong>{euro.format(risultati.iva)}</strong>
            </li>
            <li className="flex items-center justify-between gap-4">
              <span>Costi accessori finali (corriere + contributi + cambio)</span>
              <strong>{euro.format(risultati.accessori)}</strong>
            </li>
            <li className="flex items-center justify-between gap-4 border-t border-slate-200 pt-2 text-base">
              <span className="font-semibold">Totale finale</span>
              <strong>{euro.format(risultati.totale)}</strong>
            </li>
            <li className="flex items-center justify-between gap-4 rounded-lg bg-amber-50 px-2 py-2 text-base text-amber-900">
              <span className="font-semibold">Differenza rispetto al solo articolo</span>
              <strong>{euro.format(risultati.sovrapprezzoTotale)}</strong>
            </li>
          </ul>
        </section>
      </main>

      {viewerOpen && immaginiProdotto.length ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-6" onClick={chiudiViewer}>
          <div className="relative w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={chiudiViewer}
              className="absolute right-2 top-2 z-10 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white hover:bg-black/80"
            >
              Chiudi
            </button>

            <div className="relative overflow-hidden rounded-2xl bg-black">
              <img
                src={immaginiProdotto[viewerIndex]}
                alt={`Immagine ${viewerIndex + 1}`}
                className="max-h-[72vh] w-full object-contain"
              />
              {immaginiProdotto.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={immaginePrecedente}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-lg font-bold text-white hover:bg-black/80"
                    aria-label="Immagine precedente"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={prossimaImmagine}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-lg font-bold text-white hover:bg-black/80"
                    aria-label="Immagine successiva"
                  >
                    ›
                  </button>
                </>
              ) : null}
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {immaginiProdotto.map((imgUrl, idx) => (
                <button
                  key={`${imgUrl}-${idx}`}
                  type="button"
                  onClick={() => setViewerIndex(idx)}
                  className={`shrink-0 overflow-hidden rounded-lg border ${idx === viewerIndex ? 'border-amber-400 ring-2 ring-amber-300' : 'border-slate-500'}`}
                >
                  <img
                    src={imgUrl}
                    alt={`Miniatura ${idx + 1}`}
                    className="h-14 w-14 object-cover sm:h-16 sm:w-16"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  return path === '/dashboard' ? <DashboardPage /> : <HomePage />
}

export default App
