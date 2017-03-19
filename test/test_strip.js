const strip = require('../strip.js');
const fs = require("fs");
const assert = require("assert");
const Promise = require('bluebird');
const readFile = Promise.promisify(fs.readFile);
const writeFile = Promise.promisify(fs.writeFile);
const util = require('util');

Promise.all([
	readFile('./test/memberships.json')
]).then(res => {
	const memberships = JSON.parse(res[0]).memberships;
	const strip1 = strip(memberships);
	assert.equal('https://storage.googleapis.com/senders-images/cards/campaignmonitor.png', strip1.icon);
	assert.equal(strip1.text, 'Added 7 years ago. _Subscribed to_ List 5, List 1 and 2 more. _Unsubscribed from_ List 2. _Pending for_ List 4. _Deleted from_ List 3. ');
	console.log('Test OK');
}).catch(err => {
	console.log(util.inspect(err));
});

