const axios = require("axios");
const Rx = require('rxjs');
const Promise = require("bluebird");
const util = require('util');

/**
 * Returns the oauth URL to be called from the browser to trigger the oauth process.
 *
 * @param {Object} [options]
 * @param {String} [options.redirectUri] OAuth redirect URI
 * @param {String} [options.clientId] OAuth client ID
 * @param {Object} [params] additional parameters, such as loginHint, state, etc.
 * @returns {String} The OAuth URL
 */
module.exports.oauth = function (params, options) {
	const scope = 'ManageLists';
	return 'https://api.createsend.com/oauth?type=web_server'
		+ '&client_id=' + options.clientId
		+ '&redirect_uri=' + options.redirectUri
		+ '&scope=' + scope
		+ '&state=' + params.state;
};

/**
 * Returns metadata for the feature. Used to display information on the web site.
 * @returns {{icon: string, title: string, description: string}}
 */
module.exports.metadata = function () {
	return {
		icon: 'https://storage.googleapis.com/senders-images/cards/campaignmonitor.png',
		title: 'Campaign Monitor',
		description: 'See if the sender is subscribed to any of your Campaign Monitor lists.'
	};
};

/**
 * Send the authorization code and retrieve a refresh token.
 *
 * @param {Object} [params]
 * @param {String} [params.code] Authorization code.
 * @param {Object} [options]
 * @param {String} [options.redirectUri] OAuth redirect URI
 * @param {String} [options.clientId] OAuth client ID
 * @param {String} [options.clientSecret] OAuth client secret
 * @returns {String} The OAuth URL
 */
module.exports.authorize = function (params, options) {
	const code = params.code;
	return new Promise(function (resolve, reject) {
		axios.post('https://api.createsend.com/oauth/token', {}, {
			params: {
				grant_type: 'authorization_code',
				client_id: options.clientId,
				client_secret: options.clientSecret,
				code: code,
				redirect_uri: options.redirectUri
			}
		}).then(res => {
			resolve({
				accessToken: res.data.access_token,
				refreshToken: res.data.refresh_token,
				expiresOn: new Date(new Date().getTime() + res.data.expires_in * 1000)
			});
		}).catch(err => {
			reject(normalizeError(err));
		});
	});
};

module.exports.refresh = function (oauthToken) {
	return new Promise(function (resolve, reject) {
		axios.post('https://api.createsend.com/oauth/token?grant_type=refresh_token&refresh_token=' + oauthToken.refreshToken, {}).then(res => {
			if (res.data.access_token) {
				resolve({
					accessToken: res.data.access_token,
					refreshToken: res.data.refresh_token,
					expiresOn: new Date(new Date().getTime() + res.data.expires_in * 1000)
				});
			} else {
				reject(normalizeError('Campaign Monitor: No access token returned for the given refresh token'));
			}
		}).catch(err => {
			reject(normalizeError(err));
		});
	});
};

module.exports.account = function (oauthToken) {
	return new Promise(function (resolve, reject) {
		axios.defaults.baseURL = "https://api.createsend.com/api/v3.1";
		axios.defaults.headers = {
			Authorization: ("Bearer " + oauthToken.accessToken)
		};
		getClients().subscribe(clients => {
			// Limitation: for now, only get the first client
			const defaultClient = clients[0];
			resolve({
				loginName: defaultClient.Name,
				accountUrl: 'https://login.createsend.com'
			});
		}, error => {
			reject(normalizeError(error));
		});
	});
};

module.exports.fetch = function (oauthToken, email) {
	return new Promise(function (resolve, reject) {
		axios.defaults.baseURL = "https://api.createsend.com/api/v3.1";
		axios.defaults.headers = {
			Authorization: ("Bearer " + oauthToken.accessToken)
		};
		const getMembershipsFromEmail = function (client) {
			return getMemberships(client, email);
		};
		getClients()
			.flatMap(clients => {
				// Limitation: for now, only get the first client
				return Rx.Observable.of(clients[0]).flatMap(client => {
					return Rx.Observable.forkJoin(
						getLists(client),
						getMembershipsFromEmail(client)
					);
				});
			})
			.toArray()
			.subscribe(clientLists => {
				const allMemberships = [];
				clientLists.forEach(listAndMembership => {
					// Lists are not used for now...
//					const lists = listAndMembership[0];
					const memberships = listAndMembership[1];
					memberships.forEach(membership => {
						allMemberships.push(membership);
					});
				});
				// https://www.campaignmonitor.com/api/clients/#getting-lists-email-address
				resolve({
					icon: 'https://storage.googleapis.com/senders-images/cards/campaignmonitor.png?v=2',
					text: displayMemberships(allMemberships)
				});
			}, error => {
				reject(normalizeError(error));
			});
	});

};

module.exports.displayMemberships = displayMemberships;

function compareMemberships(a, b) {
	if (a.DateSubscriberAdded < b.DateSubscriberAdded) {
		return -1;
	} else if (a.DateSubscriberAdded > b.DateSubscriberAdded) {
		return 1;
	} else {
		return 0;
	}
}

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
function displayMemberships(memberships) {
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
	return text;
}


/**
 * @param internalError
 * @return Error
 */
function normalizeError(internalError) {
	var error = new Error();
	if (typeof internalError === 'string') {
		error.message = internalError;
	} else { // if (internalError instanceof Error)
		if (internalError.message) {
			error.message = internalError.message;
		} else {
			error.message = 'No Error message';
		}
		if (internalError.response) {
			var response = internalError.response;
			if (response.status) {
				error.status = response.status;
			}
			if (response.statusText) {
				error.statusText = response.statusText;
			}
			if (response.data) {
				var data = response.data;
				if (data.Code && data.Message) {
					error.cause = {
						error: data.Code,
						error_description: data.Message
					}
				} else if (data.error && data.error_description) {
					error.cause = {
						error: data.error,
						error_description: data.error_description
					};
				} else {
					error.cause = {
						error: 'unknown',
						error_description: util.inspect(data)
					}
				}
			}
		}
	}
	return error;
}

function getClients() {
	return Rx.Observable.fromPromise(axios.get('/clients.json')).map(res => res.data);
}

function getLists(client) {
	return Rx.Observable.fromPromise(axios.get('/clients/' + client.ClientID + '/lists.json')).map(res => res.data);
}

function getMemberships(client, email) {
	return Rx.Observable.fromPromise(axios.get('/clients/' + client.ClientID + '/listsforemail.json?email=' + email)).map(res => res.data);
}

