const { schedule } = require('@netlify/functions')
const Parser = require('rss-parser');
const axios = require('axios');

const FEED_URL = 'https://www.upwork.com/ab/feed/jobs/rss?q=NOT+%28video+OR+editing%29+AND+NOT%28painting%29+AND+NOT%28woodworking%29&subcategory2_uid=531770282593251334%2C1356688560628174848%2C1356688570056970240%2C531770282597445636%2C531770282589057029&job_type=hourly%2Cfixed&contractor_tier=2%2C3&budget=200-&verified_payment_only=1&hourly_rate=30-&location=Australia%2CIsrael%2CNew+Zealand%2CSingapore%2CUnited+Arab+Emirates%2CAmericas%2CEurope&sort=recency&paging=0%3B10&api_params=1&q=&securityToken=7ca22e2472d3a8cea764c463d579f40e6d6d6b2ce220c4d9003cfa604fe84816098285452bfec66a4b3b5a9770c352af8b4f691db4828381d560539165aea276&userUid=843378206036287488&orgUid=1444966160546213888';
const WEBHOOK_URL = 'https://kallemoen.app.n8n.cloud/webhook/9c1d43d2-e5e5-4d9e-9c2d-29b41cbdd603';

const parser = new Parser();

const sendNewItemsToWebhook = async () => {
  try {
    const feed = await parser.parseURL(FEED_URL);
    const currentUnixTime = Math.floor(Date.now() / 1000);
    const newItems = feed.items.filter((item) => {
      const pubDateUnixTime = Math.floor(new Date(item.pubDate).getTime() / 1000);
      return currentUnixTime - pubDateUnixTime <= 900;
    });
    newItems.forEach((item) => {
      console.log("Item:", item);
      axios.post(WEBHOOK_URL, { item }, { data: { item } });
    });
  } catch (error) {
    console.error('Failed to send webhook:', error.message);
  }
};

module.exports.handler = schedule('15 * * * *', async (event) => {
  await sendNewItemsToWebhook();
  console.log('Webhook sent!');
  const eventBody = JSON.parse(event.body)
  console.log(`Next function run at ${eventBody.next_run}.`)

  return {
    statusCode: 200,
  }
})