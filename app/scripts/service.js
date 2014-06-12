ngSub.service('model', function() {
	// Figure out how to move this, circular dependency with utils
	secondsToTime = function(secs, pad) {
		var time = '';
		if (!pad) {
			// secs = 4729
			var times = new Array(3600, 60, 1);
			var tmp;
			for (var i = 0; i < times.length; i++) {
				tmp = Math.floor(secs / times[i]);
				// 0: 4729/3600 = 1
				// 1: 1129/60 = 18
				// 2: 49/1 = 49

				if (tmp > 0) {

					if (tmp < 10 && i > 0 && time !== '') {
						tmp = '0' + tmp;
					}

					time += tmp;
					if (i < 2) {
						time += ':';
					}
				}
				secs = secs % times[i];
			}
		}
		else {
			var sec_num = parseInt(secs, 10); // don't forget the second param
			var hours = Math.floor(sec_num / 3600);
			var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
			var seconds = sec_num - (hours * 3600) - (minutes * 60);

			if (hours < 10 && sec_num > 3600) {
				hours = "0" + hours + ':';
			}
			else
				hours = '';

			if (minutes < 10) {
				minutes = "0" + minutes;
			}
			if (seconds < 10) {
				seconds = "0" + seconds;
			}
			time = hours + minutes + ':' + seconds;
		}
		return time;
	};

	this.Album = function(id, parentid, name, artist, artistId, coverartthumb, coverartfull, date, starred, description, url, type) {
		this.id = id;
		this.parentid = parentid;
		this.name = name;
		this.artist = artist;
		this.artistId = artistId;
		this.coverartthumb = coverartthumb;
		this.coverartfull = coverartfull;
		this.date = date;
		this.starred = starred;
		this.description = description;
		this.url = url;
		this.type = type;
	};

	this.Song = function(id, parentid, track, name, artist, artistId, album, albumId, coverartthumb, coverartfull, duration, rating, starred, suffix, specs, url, position, description) {
		this.id = id;
		this.parentid = parentid;
		this.track = track;
		this.name = name;
		this.artist = artist;
		this.artistId = artistId;
		this.album = album;
		this.albumId = albumId;
		this.coverartthumb = coverartthumb;
		this.coverartfull = coverartfull;
		this.duration = duration;
		this.time = duration === '' ? '00:00' : secondsToTime(duration);
		this.rating = rating;
		this.starred = starred;
		this.suffix = suffix;
		this.specs = specs;
		this.url = url;
		this.position = position;
		this.selected = false;
		this.playing = false;
		this.description = description;
		this.displayName = this.name + " - " + this.album + " - " + this.artist;
	};
});

ngSub.service('globals', function($rootScope) {

	this.Layouts = [{
		id: "grid",
		name: "Grid"
	}, {
		id: "list",
		name: "List"
	}];

	this.settings = {
		Url: "http://Jamstash.com/beta/#/archive/",
		Username: "emory",
		Password: "beaver",
		Server: "http://69.251.77.96/supysonic",
		Timeout: 10000,
		NotificationTimeout: 20000,
		Protocol: "jsonp",
		ApplicationName: "Jamstash",
		ApiVersion: "1.6.0",
		AutoPlaylists: "",
		AutoPlaylistSize: 25,
		AutoAlbumSize: 30,
		// General
		HideAZ: false,
		ScrollTitle: true,
		NotificationSong: false,
		NotificationNowPlaying: false,
		SaveTrackPosition: true,
		ForceFlash: false,
		Theme: "Default",
		DefaultLibraryLayout: this.Layouts[0],
		AutoPlay: false,
		LoopQueue: false,
		Repeat: false,
		Debug: false,
		encPassword: "enc:626561766572"
	};

	this.SavedCollections = [];
	this.SavedGenres = [];

	this.BaseURL = function() {
		return this.settings.Server + '/rest';
	};

	this.BaseParams = function() {
		return 'u=' + this.settings.Username + '&p=' + this.settings.encPassword + '&f=' + this.settings.Protocol + '&v=' + this.settings.ApiVersion + '&c=' + this.settings.ApplicationName + "&callback=JSON_CALLBACK";
	};

	this.defaultParams = function() {
		return {
			"u": this.settings.Username,
			"p": this.settings.encPassword,
			"f": this.settings.Protocol,
			"v": this.settings.ApiVersion,
			"c": this.settings.ApplicationName,
			"callback": "JSON_CALLBACK"
		};
	};


});

ngSub.directive('fancybox', function($log) {
	return {
		restrict: 'A',
		scope: {
			fancybox: "@href"
		},
		link: function(scope, element, attrs) {

			scope.$watch(function() {
				return scope.fancybox;
			}, function(newval) {

				$(element).fancybox({
					type: 'image',
					onStart: function(items, index, options) {

						var arrowStyle = {
							height: '100%',
							bottom: 0
						};

						angular.extend(options, {
							title: $(element).parent().attrs.title,
							titlePosition: 'inside',
							speedIn: 150,
							speedOut: 150
						});

						return options;
					}
				});
			}, true);
		}
	};
});

ngSub.directive('stopEvent', function() {
	return {
		restrict: 'A',
		link: function(scope, element, attr) {
			element.bind(attr.stopEvent, function(e) {
				e.stopPropagation();
			});
		}
	};
});

ngSub.directive('ngDownload', function($compile) {
	return {
		restrict: 'E',
		scope: {
			data: '='
		},
		link: function(scope, elm, attrs) {
			function getUrl() {
				return URL.createObjectURL(new Blob([JSON.stringify(scope.data)], {
					type: "application/json"
				}));
			}

			elm.append($compile(
				'<a class="button" download="backup.json"' +
				'href="' + getUrl() + '">' +
				'Download' +
				'</a>'
			)(scope));

			scope.$watch(scope.data, function() {
				elm.children()[0].href = getUrl();
			});
		}
	};
});

/* Filters */
ngSub.filter('capitalize', function() {
	return function(input, scope) {
		return input.substring(0, 1).toUpperCase() + input.substring(1);
	};
});

ngSub.service('notifications', function($rootScope, globals) {
	var msgIndex = 1;
	this.updateMessage = function(msg, autohide) {
		if (msg !== '') {
			var id = msgIndex;
			$('#messages').append('<span id=\"msg_' + id + '\" class="message">' + msg + '</span>');
			$('#messages').fadeIn();
			$("#messages").scrollTo('100%');
			var el = '#msg_' + id;
			if (autohide) {
				setTimeout(function() {
					$(el).fadeOut(function() {
						$(this).remove();
					});
				}, globals.settings.NotificationTimeout);
			}
			$(el).click(function() {
				$(el).fadeOut(function() {
					$(this).remove();
				});
				return false;
			});
			msgIndex++;
		}
	};
	this.requestPermissionIfRequired = function() {
		if (!this.hasNotificationPermission() && (window.webkitNotifications)) {
			window.webkitNotifications.requestPermission();
		}
	};
	this.hasNotificationPermission = function() {
		return !!(window.webkitNotifications) && (window.webkitNotifications.checkPermission() === 0);
	};

	var notifications = [];

	this.showNotification = function(pic, title, text, type, bind) {
		if (this.hasNotificationPermission()) {
			//closeAllNotifications()
			var popup;
			if (type == 'text') {
				popup = window.webkitNotifications.createNotification(pic, title, text);
			}
			else if (type == 'html') {
				popup = window.webkitNotifications.createHTMLNotification(text);
			}

			if (bind == '#NextTrack') {
				popup.addEventListener('click', function(bind) {
					//$(bind).click();
					$rootScope.nextTrack();
					this.cancel();
				});
			}
			notifications.push(popup);
			setTimeout(function(notWin) {
				notWin.cancel();
			}, globals.settings.NotificationTimeout, popup);
			popup.show();
		}
		else {
			console.log("showNotification: No Permission");
		}
	};
	this.closeAllNotifications = function() {
		for (var notification in notifications) {
			notifications[notification].cancel();
		}
	};
});

ngSub.directive('errSrc', function() {
	return {
		link: function(scope, element, attrs) {
			var defSrc = attrs.src;
			element.one('error', function() {
				element.attr('src', defSrc);
			});
		}
	};
});

ngSub.filter('addEllipsis', function () {
    return function (input, scope) {
        if (input.length > 25) {
            return input.substring(0, 25) + '…';  
        }
		return input;
    };
});
