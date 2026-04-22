import { load } from 'cheerio'

function cleanText(value) {
  return (value || '').replace(/\s+/g, ' ').trim()
}

function toAbsoluteUrl(baseUrl, maybeRelative) {
  if (!maybeRelative) {
    return ''
  }

  try {
    return new URL(maybeRelative, baseUrl).toString()
  } catch {
    return maybeRelative
  }
}

function uniq(items) {
  return [...new Set(items.filter(Boolean))]
}

function dlValue($, labelMatcher) {
  const labels = $('dt').toArray()
  for (const dt of labels) {
    const label = cleanText($(dt).text()).toLowerCase()
    if (!labelMatcher(label)) {
      continue
    }
    const value = cleanText($(dt).next('dd').text())
    if (value) {
      return value
    }
  }
  return ''
}

function firstText($, selectors) {
  for (const selector of selectors) {
    const value = cleanText($(selector).first().text())
    if (value) {
      return value
    }
  }

  return ''
}

function firstAttr($, selectors, attr) {
  for (const selector of selectors) {
    const value = cleanText($(selector).first().attr(attr))
    if (value) {
      return value
    }
  }

  return ''
}

function firstUrl($, sourceUrl, selectors, attr = 'href') {
  for (const selector of selectors) {
    const value = $(selector).first().attr(attr)
    if (value) {
      return toAbsoluteUrl(sourceUrl, value)
    }
  }

  return ''
}

function extractZenmarketItemCode(sourceUrl, fallbackUrl = '') {
  const urls = [sourceUrl, fallbackUrl].filter(Boolean)

  for (const value of urls) {
    try {
      const url = new URL(value)
      const itemCode = url.searchParams.get('itemCode')
      if (itemCode) {
        return itemCode
      }
    } catch {
      // Ignore invalid URLs and continue other fallbacks.
    }
  }

  return ''
}

function extractZenmarketCondition($) {
  const directCondition = firstText($, ['#lblItemStatus', '#lblConditionName'])
  if (directCondition) {
    return directCondition
  }

  const checkedCondition = cleanText($('#rblSelectCondition input:checked').next('label').text())
  if (checkedCondition) {
    return checkedCondition
  }

  return ''
}

function extractZenmarketPrice($) {
  const amount = $('#lblPrice .amount').first()
  const yen =
    firstText($, ['#lblPriceY', '#lblAltPrice']) ||
    cleanText(amount.attr('data-jpy'))

  const converted =
    firstText($, ['#lblPriceAlt', '#lblPrice']) ||
    cleanText(amount.text())

  return { yen, converted }
}

function scrapeZenmarket($, sourceUrl) {
  const japaneseName = cleanText($('#lblProductNameJp').text())
  const titleRaw = cleanText($('title').first().text())
  const titleFromPage = titleRaw.replace(/\s*-\s*Japan Shopping.*$/i, '').trim() || titleRaw
  const title =
    /^(pagina prodotto|nome dell'articolo)$/i.test(titleFromPage)
      ? japaneseName || titleFromPage
      : titleFromPage || japaneseName
  const originalUrl = firstUrl($, sourceUrl, ['#productPage'])
  const price = extractZenmarketPrice($)
  const itemId =
    firstText($, ['#txtitemCode', '#lblItemCode', '#lblSku']) ||
    extractZenmarketItemCode(sourceUrl, originalUrl)
  const sellerProfileUrl =
    firstUrl($, sourceUrl, ['#seller[href]', '#searchBySeller']) ||
    firstAttr($, ['#seller'], 'href')
  const description =
    cleanText($('#txtItemDescription').first().text()) ||
    cleanText($('meta[property="og:description"]').attr('content')) ||
    cleanText($('meta[name="description"]').attr('content'))

  const images = uniq([
    toAbsoluteUrl(sourceUrl, $('#imgPreview').attr('src')),
    ...$('#slider img.thumb')
      .map((_, el) => toAbsoluteUrl(sourceUrl, $(el).attr('src')))
      .get(),
  ])

  return {
    source: 'zenmarket',
    title,
    description,
    canonicalUrl: $('link[rel="canonical"]').attr('href') || sourceUrl,
    originalUrl,
    images,
    price: {
      ...price,
      minimumBid: cleanText($('#nextBid').text()),
    },
    seller: {
      name: cleanText($('#seller').text()),
      profileUrl: sellerProfileUrl,
    },
    item: {
      id: itemId,
      condition: extractZenmarketCondition($),
      domesticShipping: firstText($, ['#lblChargeForShipping', '#shippingWithinJp']),
      timeLeft: cleanText($('#lblTimeLeft').text()),
      endTime: cleanText($('#endTime').text()),
      japaneseName,
      brand: cleanText($('#lblBrandName').text()),
      expectedAtWarehouse: cleanText($('#lblDateExpectedAtWarehouse').text()),
    },
  }
}

function scrapeNeokyo($, sourceUrl) {
  const images = uniq([
    ...$('#product-gallery img.cloudzoom')
      .map((_, el) => toAbsoluteUrl(sourceUrl, $(el).attr('src')))
      .get(),
    ...$('#product-gallery li')
      .map((_, el) => toAbsoluteUrl(sourceUrl, $(el).attr('data-thumb')))
      .get(),
    toAbsoluteUrl(sourceUrl, $('meta[property="og:image"]').attr('content')),
  ])

  return {
    source: 'neokyo',
    title:
      cleanText($('div.mb-4 h6.translate').first().text()) ||
      cleanText($('meta[property="og:title"]').attr('content')),
    description: cleanText($('meta[name="description"]').attr('content')),
    canonicalUrl: $('link[rel="canonical"]').attr('href') || sourceUrl,
    originalUrl: $('a[href*="jp.mercari.com/item/"]').first().attr('href') || '',
    images,
    price: {
      yen: `${cleanText($('.product-price').first().text())} Yen`.trim(),
      converted: cleanText($('.product-price-converted').first().text()),
    },
    seller: {
      name:
        cleanText($('p.col-3:contains("Seller")').first().next('p.col-9').text()) ||
        cleanText($('a[href*="/seller/"]').first().text()),
      profileUrl: $('a[href*="/seller/"]').first().attr('href') || '',
    },
    item: {
      id: cleanText($('p.col-3:contains("Item ID")').next('p.col-9').text()),
      condition: cleanText($('p.col-3:contains("Condition")').next('p.col-9').text()),
      domesticShipping: cleanText($('p.col-3:contains("Domestic Shipping")').next('p.col-9').text()),
    },
  }
}

function scrapeFromJapan($, sourceUrl) {
  const conditionMap = {
    1: 'Nuovo / non usato',
    2: 'Come nuovo',
    3: 'Usato (buone condizioni)',
    4: 'Usato (condizioni visibili)',
    5: 'Da riparare / parti',
  }

  const rawBData = $("script#bData").text().trim()

  let decodedBData = null
  if (rawBData) {
    try {
      const json = Buffer.from(rawBData, 'base64').toString('utf8')
      decodedBData = JSON.parse(json)
    } catch {
      decodedBData = null
    }
  }

  const itemData = decodedBData?.item || {}

  const bDataImages = Object.entries(itemData?.img || {})
    .filter(([key, value]) => /^Image\d+$/i.test(key) && typeof value === 'string')
    .map(([, value]) => value)

  const title =
    cleanText(itemData?.name || itemData?.display_name) ||
    cleanText($('meta[property="og:title"]').attr('content')) ||
    cleanText($('h1').first().text()) ||
    cleanText($('title').first().text())

  const priceBySelector =
    (itemData?.price ? `${itemData.price} JPY` : '') ||
    cleanText($('[itemprop="price"]').first().text()) ||
    cleanText($('.price').first().text()) ||
    cleanText($('[class*="price"]').first().text())

  const priceMatch = priceBySelector.match(/[\d.,]+\s*(JPY|YEN|円)/i)
  const urlIdMatch = sourceUrl.match(/\/(m\d+)\/?(?:\?|$)/i)

  const images = uniq([
    toAbsoluteUrl(sourceUrl, $('meta[property="og:image"]').attr('content')),
    ...bDataImages,
    ...$('img')
      .slice(0, 24)
      .map((_, el) => toAbsoluteUrl(sourceUrl, $(el).attr('src') || $(el).attr('data-src')))
      .get(),
  ])

  return {
    source: 'fromjapan',
    title,
    description:
      cleanText($('meta[property="og:description"]').attr('content')) ||
      cleanText($('meta[name="description"]').attr('content')),
    canonicalUrl: $('link[rel="canonical"]').attr('href') || sourceUrl,
    originalUrl: '',
    images,
    price: {
      yen: priceMatch ? priceMatch[0].toUpperCase() : priceBySelector,
      converted: '',
    },
    seller: {
      name:
        cleanText(itemData?.seller_id) ||
        cleanText($('[class*="seller"]').first().text()) ||
        cleanText($('a[href*="seller"]').first().text()),
      profileUrl: cleanText(itemData?.seller_rating) || $('a[href*="seller"]').first().attr('href') || '',
    },
    item: {
      id: cleanText(itemData?.id) || (urlIdMatch ? urlIdMatch[1] : ''),
      condition:
        (typeof itemData?.condition === 'number'
          ? conditionMap[itemData.condition] || `Condizione ${itemData.condition}`
          : '') ||
        cleanText($('[class*="condition"]').first().text()) ||
        dlValue($, (label) => label.includes('condition')),
      domesticShipping:
        (typeof itemData?.shipping_seller === 'boolean'
          ? itemData.shipping_seller
            ? 'Seller pays domestic shipping'
            : 'Buyer pays domestic shipping'
          : '') ||
        cleanText($('[class*="shipping"]').first().text()) ||
        dlValue($, (label) => label.includes('shipping')),
      bidCount: itemData?.bid_count ?? '',
      startPrice: itemData?.start_price ? `${itemData.start_price} JPY` : '',
    },
  }
}

function scrapeBuyee($, sourceUrl) {
  const priceText = cleanText($('.m-goodsDetail__price').first().text())
  const yenMatch = priceText.match(/[\d.,]+\s*YEN/i)

  const images = uniq([
    ...$('.imageContainer__thumbImg img')
      .map((_, el) => toAbsoluteUrl(sourceUrl, $(el).attr('src') || $(el).attr('data-src')))
      .get(),
    toAbsoluteUrl(sourceUrl, $('meta[property="og:image"]').attr('content')),
  ])

  return {
    source: 'buyee',
    title:
      cleanText($('h1.m-goodsName').text()) ||
      cleanText($('meta[property="og:title"]').attr('content')),
    description:
      cleanText($('meta[property="og:description"]').attr('content')) ||
      cleanText($('meta[name="description"]').attr('content')),
    canonicalUrl: $('link[rel="canonical"]').attr('href') || sourceUrl,
    originalUrl: $('a[href*="jp.mercari.com"]').first().attr('href') || '',
    images,
    price: {
      yen: yenMatch ? yenMatch[0].toUpperCase() : '',
      converted: cleanText($('.m-goodsDetail__priceFX').first().text()),
    },
    seller: {
      name: cleanText($('.m-goodsDetail__avatarSellerContainer a').first().text()) ||
        dlValue($, (label) => label.includes('seller')),
      profileUrl: $('.m-goodsDetail__avatarSellerContainer a').first().attr('href') || '',
    },
    item: {
      id: $('input[name="item[itemId]"]').attr('value') || '',
      brand: dlValue($, (label) => label === 'brand'),
      condition: dlValue($, (label) => label.includes('item condition')),
      shippingPaidBy: dlValue($, (label) => label.includes('shipping paid by')),
      estimatedShippingDate: dlValue($, (label) => label.includes('estimated shipping date')),
    },
  }
}

export function scrapeProductFromHtml(html, sourceUrl) {
  const $ = load(html)
  const host = new URL(sourceUrl).hostname.toLowerCase()

  if (host.includes('zenmarket.jp')) {
    return scrapeZenmarket($, sourceUrl)
  }

  if (host.includes('neokyo.com')) {
    return scrapeNeokyo($, sourceUrl)
  }

  if (host.includes('buyee.jp')) {
    return scrapeBuyee($, sourceUrl)
  }

  if (host.includes('fromjapan.co.jp')) {
    return scrapeFromJapan($, sourceUrl)
  }

  return {
    source: host,
    title:
      cleanText($('meta[property="og:title"]').attr('content')) ||
      cleanText($('title').first().text()) ||
      'Prodotto',
    description:
      cleanText($('meta[property="og:description"]').attr('content')) ||
      cleanText($('meta[name="description"]').attr('content')),
    canonicalUrl: $('link[rel="canonical"]').attr('href') || sourceUrl,
    originalUrl: '',
    images: uniq([
      toAbsoluteUrl(sourceUrl, $('meta[property="og:image"]').attr('content')),
      ...$('img')
        .slice(0, 12)
        .map((_, el) => toAbsoluteUrl(sourceUrl, $(el).attr('src')))
        .get(),
    ]),
    price: { yen: '', converted: '' },
    seller: { name: '', profileUrl: '' },
    item: {},
  }
}
