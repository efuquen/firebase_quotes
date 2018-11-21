const admin = require('firebase-admin');
const fetch = require('node-fetch');

const appConfig = require('./config.json');
const firebaseServiceAccount = appConfig['firebase']['service_account'];
const mashapeKey = appConfig['mashape']['key'];
const quoteApiUrl = appConfig['mashape']['quote_api_url'];

admin.initializeApp({
  credential: admin.credential.cert(firebaseServiceAccount),
  databaseURL: 'https://' + firebaseServiceAccount['project_id'] + '.firebaseio.com'
});

const db = admin.database();
const historyRef = db.ref('/history');
const quoteRef = db.ref('/quote');
const countsRef = db.ref('/counts');
const totalCountRef = db.ref('totalCount');

function getQuote() {
  fetch(quoteApiUrl, {
    headers: {
      'X-Mashape-Key': mashapeKey,
      'Content-Type': 'application/json'
    },
  }).then((res) => res.json())
    .then((json) => {
      console.log(json);
      const quoteJson = json[0];
      const newHistoryRef = historyRef.push();
      newHistoryRef.set(quoteJson);
      quoteRef.set(quoteJson);
      totalCountRef.transaction((currentCount) => {
        return currentCount + 1;
      });
      countsRef.child(quoteJson.author).transaction((currentCount) => {
        return currentCount + 1;
      });
    }
  );
}

setInterval(getQuote, 30000);