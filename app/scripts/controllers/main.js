ngSub.controller('AppCtrl',
	function AppCtrl($scope, $rootScope, $document, $location, utils, globals, model, notifications, $http, $state, $log) {

		// Holds the currently playing song??
		$rootScope.song = [];

		// The currently playing Queue of songs
		$rootScope.queue = [];

		// The currently playing song
		$rootScope.playingSong = null;

		// Boolean if player is playing
		$rootScope.playing = false;

		// List of genres?
		$rootScope.Genres = [];

		// Current playlist?
		$rootScope.selectedPlaylist = "";

		// Current auto playlist?
		$rootScope.selectedAutoPlaylist = "";

		/*
		 * TODO. Unknown Function
		 */
		var submenu_active = false;
		$('div.submenu').mouseenter(function() {
			submenu_active = true;
		});
		$('div.submenu').mouseleave(function() {
			submenu_active = false;
			$('div.submenu').hide();
			//setTimeout(function () { if (submenu_active == false) $('div.submenu').stop().fadeOut(); }, 400);
		});

		/*
		 * Show and hide Submenus
		 */
		$scope.toggleSubmenu = function(menu, pl, pos, margin) {
			var submenu = $(menu);
			if (submenu.css('display') !== 'none') {
				submenu.fadeOut();
			}
			else {
				var el = $(pl);
				off = el.offset();
				width = el.width();
				height = el.height();
				switch (pos) {
					case 'right':
						//show the menu to the right of placeholder
						submenu.css({
							"left": (off.left + margin) + "px",
							"top": (off.top) + "px"
						}).fadeIn(400);
						break;
					case 'left':
						//show the menu to the right of placeholder
						submenu.css({
							"left": (off.left - margin) + "px",
							"top": (off.top) + "px"
						}).fadeIn(400);
						break;
				}
				setTimeout(function() {
					if (submenu_active === false) $('div.submenu').stop().fadeOut();
				}, 10000);
			}
		};

		$('#action_Welcome').fancybox({
			openEffect: 'none',
			closeEffect: 'none'
		});

		/*
		 * make scrubber a little larger when mousing over
		 */
		$('.scrubber').mouseover(function(e) {
			$('.audiojs .scrubber').stop().animate({
				height: '8px'
			});
		});
		$('.scrubber').mouseout(function(e) {
			$('.audiojs .scrubber').stop().animate({
				height: '4px'
			});
		});

		/*
		 * Hide pop-up notifications on click
		 */
		$('.message').on('click', function() {
			$(this).remove();
		});



		$scope.dragStart = function(e, ui) {
			ui.item.data('start', ui.item.index());
		};
		$scope.dragEnd = function(e, ui) {
			var start = ui.item.data('start'),
				end = ui.item.index();
			$rootScope.queue.splice(end, 0,
				$rootScope.queue.splice(start, 1)[0]);
		};

		/*
		 * Scroll to letter in artist list
		 */
		$(document).keydown(function(e) {
			var source = e.target.id;
			if (source != 'Search' && source != 'Source' && source != 'Description' && source != 'ChatMsg' && source != 'AutoPlaylists') {

				var unicode = e.charCode ? e.charCode : e.keyCode;

				if (unicode >= 65 && unicode <= 90 && $state.includes('library')) { // a-z
					var key = utils.findKeyForCode(unicode);

					var el = '#' + key.toUpperCase();

					if ($(el).length > 0) {
						$('#SubsonicIndex').stop().scrollTo(el, 400);
					}
				}
				else if (unicode == 39 || unicode == 176) { // right arrow
					$rootScope.nextTrack();
				}
				else if (unicode == 37 || unicode == 177) { // back arrow
					$rootScope.previousTrack();
				}
				else if (unicode == 32 || unicode == 179 || unicode.toString() == '0179') { // spacebar
					$rootScope.playPauseSong();
					return false;
				}
				else if (unicode == 36 && $state.includes('library')) { // home
					$('#SubsonicIndex').stop().scrollTo('#MusicFolders', 400);
				}
				if (unicode == 189) { // dash - volume down
					if (volume <= 1 && volume > 0 && source === '') {
						volume += -0.1;
						$(player1).jPlayer({
							volume: volume
						});
						utils.setValue('Volume', volume, true);
						updateMessage('Volume: ' + Math.round(volume * 100) + '%');
					}
				}
				if (unicode == 187) { // equals - volume up
					if (volume < 1 && volume >= 0 && source === '') {
						volume += 0.1;
						$(player1).jPlayer({
							volume: volume
						});
						utils.setValue('Volume', volume, true);
						updateMessage('Volume: ' + Math.round(volume * 100) + '%');
					}
				}
			}
		});

		$scope.scrollToTop = function() {
			$('#Artists').stop().scrollTo('#auto', 400);
		};

		/*
		 * Deselect Queue
		 */
		$scope.selectNone = function() {
			angular.forEach($rootScope.song, function(item, key) {
				$scope.selectedSongs = [];
				item.selected = false;
			});
		};

		$scope.download = function(id) {
			$http
				.jsonp(globals.BaseURL() + '/getUser.view?' + globals.BaseParams() + '&username=' + globals.settings.Username)
				.success(function(data) {
					if (typeof data["subsonic-response"].error != 'undefined') {
						notifications.updateMessage('Error: ' + data["subsonic-response"].error.message, true);
					}
					else {
						if (data["subsonic-response"].user.downloadRole === true) {
							$window.location.href = globals.BaseURL() + '/download.view?' + globals.BaseParams() + '&id=' + id;
						}
						else {
							notifications.updateMessage('You do not have permission to Download', true);
						}
					}
				});
		};

		$scope.ping = function() {
			$http
				.jsonp(globals.BaseURL() + '/ping.view?' + globals.BaseParams())
				.success(function(data) {
					if (data["subsonic-response"].status == 'ok') {
						$rootScope.settings.ApiVersion = data["subsonic-response"].version;
					}
					else {
						if (typeof data["subsonic-response"].error != 'undefined') {
							notifications.updateMessage(data["subsonic-response"].error.message);
						}
					}
				});
		};


		$scope.addSongToQueue = function(data) {
			$rootScope.queue.push(data);
		};

		$scope.queueRemoveSelected = function(data, event) {
			angular.forEach($scope.selectedSongs, function(item, key) {
				var index = $rootScope.queue.indexOf(item);
				if (index > -1) {
					$rootScope.queue.splice(index, 1);
				}
			});
		};

		$scope.queueEmpty = function() {
			$rootScope.queue.length = 0;
		};

		$scope.queueTotal = function() {
			var total = 0;
			ko.utils.arrayForEach(self.queue(), function(item) {
				total += parseInt(item.duration());
			});

			if (self.queue().length > 0) {
				return self.queue().length + ' song(s), ' + utils.secondsToTime(total) + ' total time';
			}
			else {
				return '0 song(s), 00:00:00 total time';
			}
		};

		$scope.queueShuffle = function() {
			$rootScope.queue.sort(function() {
				return 0.5 - Math.random();
			});
		};

		$rootScope.getRandomSongs = function(action, genre, folder) {

			if (globals.settings.Debug) {
				console.log('action:' + action + ', genre:' + genre + ', folder:' + folder);
			}

			var size = globals.settings.AutoPlaylistSize;
			$rootScope.selectedPlaylist = null;
			if (typeof folder == 'number') {
				$rootScope.selectedAutoPlaylist = folder;
			}
			else if (genre !== '') {
				$rootScope.selectedAutoPlaylist = genre;
			}
			else {
				$rootScope.selectedAutoPlaylist = 'random';
			}

			var genreParams = '';
			if (genre !== '' && genre !== 'Random') {
				genreParams = '&genre=' + genre;
			}

			folderParams = '';
			if (typeof folder == 'number' && folder !== '' && folder != 'all') {
				//alert(folder);
				folderParams = '&musicFolderId=' + folder;
			}
			else if (typeof $rootScope.SelectedMusicFolder.id != 'undefined') {
				//alert($rootScope.SelectedMusicFolder.id);
				folderParams = '&musicFolderId=' + $rootScope.SelectedMusicFolder.id;
			}

			$http
				.jsonp(globals.BaseURL() + '/getRandomSongs.view?' + globals.BaseParams() + '&size=' + size + genreParams + folderParams)
				.success(function(data) {
					if (typeof data["subsonic-response"].randomSongs.song != 'undefined') {
						var items = [];
						if (data["subsonic-response"].randomSongs.song.length > 0) {
							items = data["subsonic-response"].randomSongs.song;
						}
						else {
							items[0] = data["subsonic-response"].randomSongs.song;
						}
						if (action == 'add') {
							angular.forEach(items, function(item, key) {
								$rootScope.queue.push(utils.mapSong(item));
							});
							notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
						}
						else if (action == 'play') {
							$rootScope.queue = [];
							angular.forEach(items, function(item, key) {
								$rootScope.queue.push(utils.mapSong(item));
							});
							var next = $rootScope.queue[0];
							$scope.playSong(false, next);
							notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);
						}
						else {
							$rootScope.song = [];
							angular.forEach(items, function(item, key) {
								$rootScope.song.push(utils.mapSong(item));
							});
						}
					}
				});
		};

		$scope.playSong = function(loadonly, song) {
			$log.debug('Request play song');
			$rootScope.$broadcast('playSong', {
				'loadonly': loadonly,
				'song': song
			});
		};

		$scope.updateFavorite = function(item) {
			var id = item.id;
			var starred = item.starred;
			var url;
			if (starred) {
				url = globals.BaseURL() + '/unstar.view?' + globals.BaseParams() + '&id=' + id + '&albumId=' + id + '&artistId=' + id;
				item.starred = undefined;
			}
			else {
				url = globals.BaseURL() + '/star.view?' + globals.BaseParams() + '&id=' + id + '&albumId=' + id + '&artistId=' + id;
				item.starred = true;
			}

			$http
				.jsonp(url)
				.success(function() {
					notifications.updateMessage('Favorite Updated!', true);
				});
		};

	});
