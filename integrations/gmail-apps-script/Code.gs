const APP_SCHEMA = 'ghrab-essay-feedback-v1';
const MAX_ITEMS = 20;

function doGet() {
  return jsonResponse_({ok:true, service:'Hodnotitel Gmail Bridge', version:'1.1'});
}

function doPost(e) {
  try {
    const raw = (e && e.parameter && e.parameter.payload) || (e && e.postData && e.postData.contents) || '{}';
    const payload = JSON.parse(raw);
    validatePayload_(payload);
    const action = payload.action === 'send' ? 'send' : 'createDrafts';
    const results = [];
    payload.items.forEach(function(item) {
      if (action === 'send') {
        GmailApp.sendEmail(item.email, item.subject, item.plainBody || stripHtml_(item.htmlBody), {
          htmlBody: item.htmlBody || undefined,
          name: payload.senderName || undefined
        });
        results.push({code:item.code, status:'sent'});
      } else {
        GmailApp.createDraft(item.email, item.subject, item.plainBody || stripHtml_(item.htmlBody), {
          htmlBody: item.htmlBody || undefined,
          name: payload.senderName || undefined
        });
        results.push({code:item.code, status:'draft-created'});
      }
    });
    return jsonResponse_({ok:true, action:action, count:results.length, results:results});
  } catch (error) {
    return jsonResponse_({ok:false, message:String(error && error.message || error)});
  }
}

function validatePayload_(payload) {
  if (!payload || payload.schema !== APP_SCHEMA) throw new Error('Neplatné schema požadavku.');
  const expected = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
  if (!expected) throw new Error('V Script Properties není nastaveno SHARED_SECRET.');
  if (payload.secret !== expected) throw new Error('Neplatné sdílené tajemství.');
  if (!Array.isArray(payload.items) || !payload.items.length) throw new Error('Chybí položky k distribuci.');
  if (payload.items.length > MAX_ITEMS) throw new Error('Jedna série může obsahovat nejvýše 20 zpráv.');
  const seen = {};
  payload.items.forEach(function(item) {
    if (!item.approved) throw new Error(item.code + ': výsledek není schválený.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(item.email || ''))) throw new Error(item.code + ': neplatný e-mail.');
    const key = String(item.email).toLowerCase();
    if (seen[key]) throw new Error(item.code + ': duplicitní e-mail.');
    seen[key] = true;
    if (!item.subject || (!item.plainBody && !item.htmlBody)) throw new Error(item.code + ': chybí obsah zprávy.');
  });
}

function stripHtml_(html) {
  return String(html || '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function jsonResponse_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
