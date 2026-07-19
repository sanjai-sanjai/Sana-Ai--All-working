const https = require('https');

const instances = [
  'meet.jit.si',
  'jitsi.riot.im',
  'meet.linux.it',
  'jitsi.member.fsf.org',
  'meet.ffmuc.net',
  'jitsi.zrh.fnwk.ch'
];

async function checkCSP(host) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: host,
      port: 443,
      path: '/',
      method: 'HEAD'
    }, (res) => {
      const csp = res.headers['content-security-policy'];
      const xfo = res.headers['x-frame-options'];
      let allowsFraming = true;
      if (xfo && (xfo.toLowerCase() === 'deny' || xfo.toLowerCase() === 'sameorigin')) {
        allowsFraming = false;
      }
      if (csp && csp.includes('frame-ancestors') && !csp.includes('*')) {
        allowsFraming = false;
      }
      resolve({ host, allowsFraming, csp, xfo, status: res.statusCode });
    });
    req.on('error', () => resolve({ host, error: true }));
    req.end();
  });
}

async function run() {
  for (const host of instances) {
    const res = await checkCSP(host);
    console.log(res);
  }
}

run();
