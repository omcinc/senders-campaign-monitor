const lambda = require('./index');
const assert = require("assert");
const util = require("util");

const refreshToken = 'AVJQbFWF869FiSe098uNJ8cyNw==';

const invalidEncryptedToken = 'RNF7dYLoOmjF1TpBjVLB5Hjs28t7BRHepfjnv8MTjMI=';
lambda.refresh(invalidEncryptedToken)
	.then(res => {
		assert.fail('Should not happen');
	})
	.catch(err => {
		assert.ok(err.message.indexOf('No access token returned for the given refresh token') != -1);
		console.log('Test OK: ' + err);
	});

const invalidToken = 'An invalid token';
lambda.refresh(invalidToken)
	.then(res => {
		assert.fail('Should not happen');
	})
	.catch(err => {
		assert.ok(err.message.indexOf('Request failed with status code 400') != -1);
		console.log('Test OK: ' + err);
	});

lambda.refresh(refreshToken)
	.then(res => {
		let accessToken = res.accessToken;
		return Promise.all([
			lambda.fetch(accessToken, 'antoine@onemore.company').then(res => {
				console.log('Test OK: ' + 'Fetch ' + JSON.stringify(res));
			}),
			lambda.account(accessToken).then(res => {
				console.log('Test OK: ' + 'Account ' + JSON.stringify(res));
			}),
			// lambda.authorize('AURp1cdZsbtKo5sGZOLRrDYyNA==', {
			// 	clientId: '106113',
			// 	clientSecret: 'J00yGqH002FLAn8000kWvE0k54000ej000w0c07We0lGbU0v0X6Dzg50Ztj000cU0XsK0ZblEgi10KJn',
			// 	redirectUri: 'https://6af72a66.sende.rs:8445/campaign-monitor/oauth/callback'
			// }).then(res => {
			// 	console.log('Auth ' + res);
			// 	console.log('Test OK');
			// })
		]);
	})
	.catch(err => {
		console.log(err);
	});

// Missing email address
lambda.refresh(refreshToken)
	.then(res => {
		let accessToken = res.accessToken;
		return lambda.fetch(accessToken);
	})
	.catch(err => {
		assert.ok(err.cause);
		assert.equal(1, err.cause.error);
		assert.equal('Invalid Email Address', err.cause.error_description);
		console.log('Test OK: ' + err.cause.error_description);
	});

lambda.refresh(refreshToken)
	.then(res => {
		return lambda.fetch(res.accessToken, 'a wrong email address');
	})
	.catch(err => {
		assert.ok(err.cause);
		assert.equal(1, err.cause.error);
		assert.equal('Invalid Email Address', err.cause.error_description);
		console.log('Test OK: ' + err.cause.error_description);
	});
