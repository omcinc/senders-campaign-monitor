const cm = require('../index.js');
const assert = require('assert');

const memberships = [
	{
		"ListID": "a58ee1d3039b8bec838e6d1482a8a965",
		"ListName": "List 1",
		"SubscriberState": "Active",
		"DateSubscriberAdded": "2013-03-19 11:15:00"
	},
	{
		"ListID": "99bc35084a5739127a8ab81eae5bd305",
		"ListName": "List 2",
		"SubscriberState": "Unsubscribed",
		"DateSubscriberAdded": "2011-04-01 01:27:00"
	},
	{
		"ListID": "99bc35084a5739127a8ab81eae5bd305",
		"ListName": "List 3",
		"SubscriberState": "Deleted",
		"DateSubscriberAdded": "2010-04-01 01:27:00"
	},
	{
		"ListID": "99bc35084a5739127a8ab81eae5bd305",
		"ListName": "List 4",
		"SubscriberState": "Unconfirmed",
		"DateSubscriberAdded": "2010-04-01 01:27:00"
	},
	{
		"ListID": "a58ee1d3039b8bec838e6d1482a8a965",
		"ListName": "List 5",
		"SubscriberState": "Active",
		"DateSubscriberAdded": "2012-03-19 11:15:00"
	},
	{
		"ListID": "a58ee1d3039b8bec838e6d1482a8a965",
		"ListName": "List 6",
		"SubscriberState": "Active",
		"DateSubscriberAdded": "2017-03-19 11:15:00"
	},
	{
		"ListID": "a58ee1d3039b8bec838e6d1482a8a965",
		"ListName": "List 7",
		"SubscriberState": "Active",
		"DateSubscriberAdded": "2016-03-19 11:15:00"
	},
];

assert.equal('__Subscribed to__ List 5, List 1 and 2 more. __Unsubscribed from__ List 2. __Pending for__ List 4. __Deleted from__ List 3. ', cm.displayMemberships(memberships));
console.log('Test OK');