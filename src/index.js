const admin = require('firebase-admin');
var config = require('config');
const fetch = require('node-fetch');

const MS_IN_SEC = 1000;

const firebaseServiceAccount = config.get('firebase').get('service_account');
const quoteApiUrl = config.get('quote_api_url');

admin.initializeApp({
  credential: admin.credential.cert(config.util.toObject(firebaseServiceAccount)),
  databaseURL: 'https://' + firebaseServiceAccount.get('project_id') + '.firebaseio.com'
});

const db = admin.database();
const historyRef = db.ref('/history');
const historyCountRef = db.ref('/history_count');
const quoteRef = db.ref('/quote');

let previousQuote = null;

function getQuote() {
  fetch(quoteApiUrl, {
    headers: {
      'Content-Type': 'application/json'
    },
  }).then((res) => res.json())
    .then((json) => {
      const quoteJson =  {
          "quote": json[0].content.replace('<p>', '').replace('</p>', ''),
          "author": json[0].title
      };
      quoteRef.set(quoteJson);

      if(previousQuote != null) {
        const newHistoryRef = historyRef.push();
        newHistoryRef.set(previousQuote);
        historyCountRef.transaction((currentCount) => {
          return currentCount + 1;
        });
      }

      previousQuote = quoteJson;
    }
  );
}

setInterval(getQuote, config.get("quote_rotate_seconds") * MS_IN_SEC);
