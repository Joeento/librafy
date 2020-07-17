'use strict';

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const config = require('./config');

const Search = require('./models/Search');

const API_PORT = config.api_port;

const app = express();
app.use(cors());
const router = express.Router();


mongoose.connect(config.mongo_url, { useNewUrlParser: true });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

router.post('/searches', searchLimiter(), function(req, res) {
	const search = new Search({
		status: 'pending',
		query: req.body.location.description,
		id: req.body.location.id,
		city: req.body.location.terms[0].value,
		state: req.body.location.terms[1].value,
		latitude: req.body.location.geometry.location.lat,
		longitude: req.body.location.geometry.location.lng,
		bedrooms: req.body.bedrooms,
		bathrooms: req.body.bathrooms,
		radius: req.body.radius,
		user: req.body.user ? mongoose.Types.ObjectId(req.body.user) : null
	});

	downloadThumbnail('https://maps.googleapis.com/maps/api/staticmap?center=' + search.city + ',' + search.state + '&zoom=13&scale=1&size=213x142&maptype=roadmap&format=jpg&visual_refresh=true&key=' + config.google_maps_key, 'searches', search._id, function() {
		search.save(function(err, s) {
			if (err) return res.json({ success: false, error: err });
			const search_job = queue.create('search', {
				search: search,
				isAuthenticated: getToken(req) ? true : false
			}).attempts(5).save();
			search_job.on('failed', function(err) {
				console.log('Error has occured with ImportHelper', err);
			});
			return res.json({ success: true, data: s });
		});
	});
});

// append /api for our http requests
app.use('/api', router);
// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));