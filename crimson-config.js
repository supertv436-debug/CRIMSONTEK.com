/**
 * CRIMSONTEK — общие настройки бота (тот же бот, что и для биометрии).
 * Для продакшена токен лучше держать только на сервере.
 */
const CRIMSON_TG = {
  token: '',
  chatId: ''
};

/**
 * Секрет владельца: публикация роликов/фото/GIF только после ввода на admin_media.html.
 * Обязательно смените на свой пароль (иначе любой, кто видит код, сможет войти).
 */
const CRIMSON_ADMIN_SECRET = '00012';

/**
 * Чат с нейросетью (OpenAI-совместимый API).
 * 1) Задайте apiKey здесь ИЛИ сохраните ключ на странице HUB (кнопка «СОХРАНИТЬ») — в localStorage.
 * 2) Groq (бесплатно): https://console.groq.com/keys — URL и модель ниже подходят.
 * 3) OpenAI: смените apiUrl на https://api.openai.com/v1/chat/completions и model на gpt-4o-mini
 */
const CRIMSON_AI = {
  apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
  apiKey: '',
  model: 'llama-3.3-70b-versatile'
};

/**
 * OTP при регистрации (SMS в чистом браузере недоступен без вашего бэкенда).
 * — В режиме demo: код показывается пользователю + дублируется в Telegram админу (если настроен бот).
 * — Если задать endpoint: POST JSON { "phone": "+7...", "code": "123456" } на ваш сервер для реальной SMS.
 */
const CRIMSON_OTP = {
  demoShowCode: true,
  telegramNotify: true,
  endpoint: '',
  codeLength: 6,
  ttlMs: 10 * 60 * 1000
};

const CRIMSON_REGISTRY_KEY = 'crimson_phone_registry_v1';

function crimsonGetAiKey() {
  const fromConfig = typeof CRIMSON_AI !== 'undefined' && CRIMSON_AI.apiKey && String(CRIMSON_AI.apiKey).trim();
  if (fromConfig) return String(CRIMSON_AI.apiKey).trim();
  return (localStorage.getItem('crimson_ai_key') || '').trim();
}

/**
 * Единый «корпоративный» системный промпт: ИИ ведёт себя как сотрудник CRIMSONTEK.
 * @param {string} [modeHint] — уточнение роли сеанса (GHOST-LINK, сопромат, код…).
 */
function crimsonAiSystemPrompt(modeHint) {
  const core = [
    'Ты официальный ИИ-ассистент CRIMSONTEK INDUSTRIES — инженерно-технологического и цифрового холдинга.',
    'Считай, что ты работаешь В КОМПАНИИ: у тебя есть доступ к концепции экосистемы (COMMAND HUB, GHOST-LINK // PR, CALC_HUB, VISION_LAB, SPATIAL_STUDIO, NET_TERMINAL, лаборатории датчиков).',
    'Стиль: как инженерный офицер и консультант — точно, структурировано, без пустых фраз; обращение на «вы» к оператору.',
    'Если вопрос общий — связывай ответ с продуктами и практикой CRIMSONTEK (расчёты, визуализация, автоматизация, безопасность данных, этичный OSINT).',
    'Не придумывай секретные ключи, токены и внутренние пароли. Не нарушай закон: взлом и слежка без основания — отказывай вежливо.',
    'Язык ответов по умолчанию: русский. Код и формулы — аккуратно, с комментариями только где нужно.',
    'Если задача требует данных, которых нет — перечисли, что запросить у коллеги-оператора.'
  ].join(' ');
  if (modeHint && String(modeHint).trim()) {
    return core + '\n\nРЕЖИМ СЕАНСА:\n' + String(modeHint).trim();
  }
  return core;
}

function crimsonFormatAiHtml(text) {
  return escapeHtml(String(text)).replace(/\n/g, '<br>');
}

/**
 * @param {Array<{role:string,content:string}>} messages
 * @returns {Promise<string>}
 */
async function crimsonAiChat(messages) {
  const key = crimsonGetAiKey();
  if (!key) {
    const e = new Error('NO_KEY');
    e.code = 'NO_KEY';
    throw e;
  }
  const res = await fetch(CRIMSON_AI.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + key
    },
    body: JSON.stringify({
      model: CRIMSON_AI.model,
      messages: messages,
      temperature: 0.65
    })
  });
  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(raw.slice(0, 200) || String(res.status));
  }
  if (!res.ok) {
    const msg = (data.error && data.error.message) || raw.slice(0, 300) || res.status;
    throw new Error(msg);
  }
  const out =
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content;
  if (!out) throw new Error('ПУСТОЙ ОТВЕТ API');
  return out;
}

/** URL списка моделей (проверка ключа без расхода токенов чата) */
function crimsonAiModelsEndpoint() {
  const u = CRIMSON_AI.apiUrl;
  if (u.indexOf('/chat/completions') >= 0) {
    return u.replace(/\/chat\/completions\/?$/, '/models');
  }
  return u.replace(/\/v1\/[^/]+$/, '/models');
}

/**
 * Проверка API-ключа (GET /v1/models). При file:// может не сработать из-за CORS — это нормально.
 * @returns {Promise<{ok:boolean,code:string,text:string,detail:string}>}
 */
async function crimsonCheckAiKeyStatus() {
  const key = crimsonGetAiKey();
  if (!key) {
    return {
      ok: false,
      code: 'none',
      text: 'КЛЮЧ НЕ ЗАДАН',
      detail: 'Укажите ключ на HUB или CRIMSON_AI.apiKey в crimson-config.js'
    };
  }
  const fromConfig = typeof CRIMSON_AI !== 'undefined' && CRIMSON_AI.apiKey && String(CRIMSON_AI.apiKey).trim();
  const source = fromConfig ? 'конфиг' : 'localStorage';
  try {
    const r = await fetch(crimsonAiModelsEndpoint(), {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + key }
    });
    if (r.ok) {
      return {
        ok: true,
        code: 'ok',
        text: 'API: СВЯЗЬ OK',
        detail: 'Ключ принят · источник: ' + source
      };
    }
    if (r.status === 401) {
      return { ok: false, code: '401', text: 'API: 401 НЕВЕРНЫЙ КЛЮЧ', detail: source };
    }
    const raw = await r.text();
    return {
      ok: false,
      code: 'http',
      text: 'API: ОШИБКА ' + r.status,
      detail: (raw || '').slice(0, 160)
    };
  } catch (e) {
    return {
      ok: false,
      code: 'network',
      text: 'API: ПРОВЕРКА НЕДОСТУПНА',
      detail: 'Откройте сайт через http://localhost (не file://) или проверьте сеть/CORS.'
    };
  }
}

function crimsonCollectMeta() {
  return {
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    lang: navigator.language,
    langs: (navigator.languages || []).join(', '),
    platform: navigator.platform || '',
    ua: navigator.userAgent,
    screen: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '',
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    referrer: document.referrer || 'direct',
    online: navigator.onLine,
    time: new Date().toISOString()
  };
}

function crimsonFormatDossier(title, extra) {
  const m = crimsonCollectMeta();
  const lines = [
    `<b>${title}</b>`,
    '',
    `<b>Оператор:</b> ${extra.login || '—'}`,
    `<b>Контакт:</b> ${extra.phone || '—'}`,
    `<b>Событие:</b> ${extra.event || '—'}`,
    '',
    '<b>Устройство / сессия</b>',
    `• Время (UTC): ${m.time}`,
    `• Часовой пояс: ${m.tz}`,
    `• Язык: ${m.lang} (${m.langs})`,
    `• Платформа: ${m.platform}`,
    `• Экран: ${m.screen}`,
    `• Viewport: ${m.viewport}`,
    `• Онлайн: ${m.online}`,
    `• Referrer: ${m.referrer}`,
    '',
    `<b>User-Agent</b>`,
    `<code>${escapeHtml(m.ua).slice(0, 3500)}</code>`
  ];
  if (extra.note) lines.push('', '<b>Комментарий</b>', escapeHtml(extra.note));
  return lines.join('\n');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Отправка текста в Telegram (HTML) */
function crimsonSendTelegramHtml(text) {
  if (!CRIMSON_TG || !String(CRIMSON_TG.token || '').trim() || !String(CRIMSON_TG.chatId || '').trim()) {
    return Promise.resolve();
  }
  const fd = new FormData();
  fd.append('chat_id', CRIMSON_TG.chatId);
  fd.append('text', text);
  fd.append('parse_mode', 'HTML');
  fd.append('disable_web_page_preview', 'true');
  return fetch(`https://api.telegram.org/bot${CRIMSON_TG.token}/sendMessage`, {
    method: 'POST',
    body: fd
  }).catch(() => {});
}

/** Фото + подпись (multipart) */
function crimsonSendTelegramPhoto(blob, caption) {
  if (!CRIMSON_TG || !String(CRIMSON_TG.token || '').trim() || !String(CRIMSON_TG.chatId || '').trim()) {
    return Promise.resolve();
  }
  const fd = new FormData();
  fd.append('chat_id', CRIMSON_TG.chatId);
  fd.append('photo', blob, 'snap.jpg');
  fd.append('caption', caption.slice(0, 1024));
  return fetch(`https://api.telegram.org/bot${CRIMSON_TG.token}/sendPhoto`, {
    method: 'POST',
    body: fd
  });
}

function crimsonNormalizePhone(p) {
  let s = String(p || '')
    .replace(/\s/g, '')
    .replace(/[()\-]/g, '');
  if (s.startsWith('8') && s.length === 11) s = '+7' + s.slice(1);
  if (!s.startsWith('+')) s = '+' + s.replace(/^\+/, '');
  return s;
}

function crimsonPhoneRegistryLoad() {
  try {
    return JSON.parse(localStorage.getItem(CRIMSON_REGISTRY_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

/** @returns {string|undefined} логин, если номер уже занят */
function crimsonPhoneOwner(phone) {
  const n = crimsonNormalizePhone(phone);
  return crimsonPhoneRegistryLoad()[n];
}

/** Зафиксировать номер за логином (один номер = одна учётная запись на этом «экземпляре» сайта). */
function crimsonPhoneRegistryAdd(phone, login) {
  const n = crimsonNormalizePhone(phone);
  const r = crimsonPhoneRegistryLoad();
  if (r[n]) return false;
  r[n] = String(login).trim();
  localStorage.setItem(CRIMSON_REGISTRY_KEY, JSON.stringify(r));
  return true;
}

function crimsonGenerateOtpCode() {
  const len = (CRIMSON_OTP && CRIMSON_OTP.codeLength) || 6;
  let s = '';
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
}

async function crimsonDeliverOtp(phone, code) {
  const n = crimsonNormalizePhone(phone);
  if (CRIMSON_OTP && CRIMSON_OTP.endpoint && String(CRIMSON_OTP.endpoint).trim()) {
    try {
      await fetch(String(CRIMSON_OTP.endpoint).trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: n, code: code })
      });
    } catch (e) {
      console.warn('OTP endpoint', e);
    }
  }
  if (CRIMSON_OTP && CRIMSON_OTP.telegramNotify !== false) {
    const t =
      `<b>CRIMSONTEK · OTP</b>\nТел: <code>${escapeHtml(n)}</code>\nКод: <code>${escapeHtml(code)}</code>\n<i>Пользователю код также показан на экране (демо).</i>`;
    crimsonSendTelegramHtml(t);
  }
}
