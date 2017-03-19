const moment = require('moment');

/**
 * [
 *  {
 * 		 "ListID": "a58ee1d3039b8bec838e6d1482a8a965",
 * 		 "ListName": "List One",
 * 		 "SubscriberState": "Active",
 * 		 "DateSubscriberAdded": "2010-03-19 11:15:00"
 *  },
 *  {
 * 		 "ListID": "99bc35084a5739127a8ab81eae5bd305",
 * 		 "ListName": "List Two",
 * 		 "SubscriberState": "Unsubscribed",
 * 		 "DateSubscriberAdded": "2011-04-01 01:27:00"
 *  }
 * ]
 */
module.exports = function (memberships) {
	const stateNames = {
		"Active": "Subscribed to",
		"Unsubscribed": "Unsubscribed from",
		"Unconfirmed": "Pending for",
		"Bounced": "Bounced from",
		"Deleted": "Deleted from",
	};
	var text = '';
	if (memberships.length == 0) {
		text = "Not in any list.";
	} else {
		var addedOn = memberships.map(m => new Date(m.DateSubscriberAdded)).reduce((a,b) => Math.min(a,b));
		if (addedOn) {
			text += 'Added ' + moment(addedOn).fromNow() + '. ';
		}
		Object.keys(stateNames).forEach(s => {
			const members = memberships.filter(m => { return s == m.SubscriberState; });
			if (members.length > 0) {
				members.sort(compareMemberships);
				text += '_' + stateNames[s] + '_ ';
				text += members.slice(0, 2).map(m => m.ListName).join(', ');
				if (members.length > 2) {
					text += ' and ' + (members.length - 2) + ' more. ';
				} else {
					text += '. ';
				}
			}
		});
	}
	return {
		icon: 'https://storage.googleapis.com/senders-images/cards/campaignmonitor.png',
		text: text
	};
};

function compareMemberships(a, b) {
	if (a.DateSubscriberAdded < b.DateSubscriberAdded) {
		return -1;
	} else if (a.DateSubscriberAdded > b.DateSubscriberAdded) {
		return 1;
	} else {
		return 0;
	}
}
