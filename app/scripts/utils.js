ngSub.service('utils', function(globals, model, $rootScope, $log, notifications) {

	this.setValue = function(key, value, notify) {

		if ($rootScope.db !== undefined) {
			if (value === null) {
				$rootScope.db.removeItem(key);
				return;
			}

			$rootScope.db.setItem(key, angular.toJson(value), function() {
				return;
			});

			return;
		}

		asyncStorage.create("JamstashDB", function(db, num) {

			$rootScope.db = db;

			if (value === null) {
				$rootScope.db.removeItem(key);
				return;
			}

			$rootScope.db.setItem(key, value, function() {
				$log.debug('set ' + key);
			});

		});
	};

	this.getValue = function(key, callback) {

		$log.debug('Loading from asyncStore: ' + key);

		if ($rootScope.db !== undefined) {
			$rootScope.db.getItem(key, function(value) {
				callback(angular.fromJson(value));
			});
			return;
		}

		asyncStorage.create("JamstashDB", function(db, num) {
			$log.debug('Finished Loading: ' + key);
			$rootScope.db = db;
			$rootScope.db.getItem(key, function(value) {
				callback(angular.fromJson(value));

			});
		});
	};

	this.loadTrackPosition = function() {
		// Load Saved Song
		this.getValue('CurrentSong', function(song) {
			if (song) {
				$log.debug("Loaded Saved Song");
				$log.debug(song);
				$rootScope.$broadcast('playSong', {'loadonly': true, 'song': song});
			}
		});

		// Load Saved Queue
		this.getValue('CurrentQueue', function(items) {
			if (items) {
				$rootScope.queue = items;

				if ($rootScope.queue.length > 0) {
					notifications.updateMessage($rootScope.queue.length + ' Saved Song(s)', true);
				}

				$log.debug('Play Queue Loaded : ' + $rootScope.queue.length + ' song(s)');
			}
		});
	};

	this.mapSong = function(song) {

		var url, title, track, rating, starred, contenttype, suffix, description;
		var specs = '',
			coverartthumb = '',
			coverartfull = '';

		if (song.coverArt) {
			coverartthumb = globals.BaseURL() + '/getCoverArt.view?' + globals.BaseParams() + '&size=60&id=' + song.coverArt;
			coverartfull = globals.BaseURL() + '/getCoverArt.view?' + globals.BaseParams() + '&id=' + song.coverArt;
		}
		if (typeof song.description == 'undefined') {
			description = '';
		}
		else {
			description = song.description;
		}

		if (typeof song.title == 'undefined') {
			title = '&nbsp;';
		}
		else {
			title = song.title.toString();
		}

		if (typeof song.track == 'undefined') {
			track = '';
		}
		else {
			track = song.track.toString();
		}

		if (typeof song.starred !== 'undefined') {
			starred = true;
		}
		else {
			starred = false;
		}

		if (song.artist === undefined) {
			song.artist = '';
		}

		if (song.bitRate !== undefined) {
			specs += song.bitRate + '<small>Kbps</small> ';
		}

		if (song.transcodedSuffix !== undefined) {
			specs += song.suffix + '⇝' + song.transcodedSuffix;
		}
		else {
			specs += ', ' + song.suffix;
		}

		if (song.transcodedSuffix !== undefined) {
			suffix = song.transcodedSuffix;
		}
		else {
			suffix = song.suffix;
		}

		if (suffix == 'ogg') {
			suffix = 'oga';
		}

		url = globals.BaseURL() + '/stream.view?' + globals.BaseParams() + '&id=' + song.id;

		var s = {
			id: song.id,
			parentid: song.parent,
			track: track,
			name: title,
			artist: song.artist,
			artistId: song.artist.id,
			album: song.album,
			albumId: song.albumId,
			coverartthumb: coverartthumb,
			coverartfull: coverartfull,
			duration: song.duration,
			rating: song.userRating,
			starred: starred,
			suffix: suffix,
			specs: specs,
			url: url,
			position: 0,
			description: description,
			time: secondsToTime(song.duration),
			selected: false,
			playing: false,
			displayName: title + " - " + song.album + " - " + song.artist
		};

		return s;
	};

	this.confirmDelete = function(text) {
		var question = confirm(text);
		if (question) {
			return true;
		}
		else {
			return false;
		}
	};

	this.makeBaseAuth = function(user, password) {
		var tok = user + ':' + password;
		var hash = $.base64Encode(tok);
		return "Basic " + hash;
	};

	this.HexEncode = function(n) {
		for (var u = "0123456789abcdef", i = [], r = [], t = 0; t < 256; t++)
			i[t] = u.charAt(t >> 4) + u.charAt(t & 15);
		for (t = 0; t < n.length; t++)
			r[t] = i[n.charCodeAt(t)];
		return r.join("");
	};

	this.switchTheme = function(theme) {
		switch (theme.toLowerCase()) {
			case 'dark':
				$('link[data-name=theme]').attr('href', 'style/Dark.css');
				break;
			case 'default':
				$('link[data-name=theme]').attr('href', '');
				break;
			default:
				break;
		}
	};

	this.timeToSeconds = function(time) {
		var a = time.split(':'); // split it at the colons
		var seconds;
		switch (a.length) {
			case 1:
				seconds = 0;
				break;
			case 2:
				seconds = (parseInt(a[0])) * 60 + (parseInt(a[1]));
				break;
			case 3:
				seconds = (parseInt(a[0])) * 60 * 60 + (parseInt(a[1])) * 60 + (parseInt(a[2]));
				break;
			default:
				break;
		}
		return seconds;
	};

	this.findKeyForCode = function(code) {
		var map = {
			'keymap': [{
				'key': 'a',
				'code': 65
			}, {
				'key': 'b',
				'code': 66
			}, {
				'key': 'c',
				'code': 67
			}, {
				'key': 'd',
				'code': 68
			}, {
				'key': 'e',
				'code': 69
			}, {
				'key': 'f',
				'code': 70
			}, {
				'key': 'g',
				'code': 71
			}, {
				'key': 'h',
				'code': 72
			}, {
				'key': 'i',
				'code': 73
			}, {
				'key': 'j',
				'code': 74
			}, {
				'key': 'k',
				'code': 75
			}, {
				'key': 'l',
				'code': 76
			}, {
				'key': 'm',
				'code': 77
			}, {
				'key': 'n',
				'code': 78
			}, {
				'key': 'o',
				'code': 79
			}, {
				'key': 'p',
				'code': 80
			}, {
				'key': 'q',
				'code': 81
			}, {
				'key': 'r',
				'code': 82
			}, {
				'key': 's',
				'code': 83
			}, {
				'key': 't',
				'code': 84
			}, {
				'key': 'u',
				'code': 85
			}, {
				'key': 'v',
				'code': 86
			}, {
				'key': 'w',
				'code': 87
			}, {
				'key': 'x',
				'code': 88
			}, {
				'key': 'y',
				'code': 89
			}, {
				'key': 'z',
				'code': 90
			}]
		};
		var keyFound = 0;
		$.each(map.keymap, function(i, mapping) {
			if (mapping.code === code) {
				keyFound = mapping.key;
			}
		});
		return keyFound;
	};

	this.toHTML = {
		on: function(str) {
			var a = [],
				i = 0;
			for (; i < str.length;) a[i] = str.charCodeAt(i++);
			return "&#" + a.join(";&#") + ";";
		},
		un: function(str) {
			if (str !== undefined)
				return str.replace(/&#(x)?([^;]{1,5});?/g,
					function(a, b, c) {
						return String.fromCharCode(parseInt(c, b ? 16 : 10));
					});
		}
	};

	this.setTitle = function(text) {
		if (text !== "") {
			document.title = text;
		}
	};

	var timer = 0;
	this.scrollTitle = function(text) {
		var shift = {
			"left": function(a) {
				a.push(a.shift());
			},
			"right": function(a) {
				a.unshift(a.pop());
			}
		};
		var opts = {
			text: text,
			dir: "left",
			speed: 1200
		};

		t = (opts.text || document.title).split("");
		if (!t) {
			return;
		}
		t.push(" ");
		clearInterval(timer);
		timer = setInterval(function() {
			var f = shift[opts.dir];
			if (f) {
				f(t);
				document.title = t.join("");
			}
		}, opts.speed);
	};

	this.parseVersionString = function(str) {
		if (typeof(str) != 'string') {
			return false;
		}
		var x = str.split('.');
		// parse from string or default to 0 if can't parse
		var maj = parseInt(x[0]) || 0;
		var min = parseInt(x[1]) || 0;
		var pat = parseInt(x[2]) || 0;
		return {
			major: maj,
			minor: min,
			patch: pat
		};
	};

	this.checkVersion = function(runningVersion, minimumVersion) {
		if (runningVersion.major >= minimumVersion.major) {
			if (runningVersion.minor >= minimumVersion.minor) {
				if (runningVersion.patch >= minimumVersion.patch) {
					return true;
				}
				else {
					return false;
				}
			}
			else {
				return false;
			}
		}
		else {
			return false;
		}
	};

	this.checkVersionNewer = function(runningVersion, newVersion) {
		if (runningVersion.major < newVersion.major) {
			return true;
		}
		else {
			if (runningVersion.minor < newVersion.minor) {
				return true;
			}
			else {
				if (runningVersion.patch < newVersion.patch) {
					return true;
				}
				else {
					return false;
				}
			}
		}
	};

	this.parseDate = function(date) {
		// input: "2012-09-23 20:00:00.0"
		var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		var parts = date.split(" ");
		var dateParts = parts[0].split("-");
		var month = parseInt(dateParts[1], 10) - 1;
		date = months[month] + " " + dateParts[2] + ", " + dateParts[0];
		return date;
	};

});
