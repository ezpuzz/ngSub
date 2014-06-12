ngSub.controller('PlayerCtrl', function($rootScope, $scope, $window, utils, globals, model, notifications, $http, $log, $sce) {

	$scope.$watch(function(){return globals.settings;}, function(newval){
		$log.debug(newval);
		if (newval) $scope.settings = newval;
	});
	
	/* for Swift.fm */
	$rootScope.unity = null;

	$rootScope.volume = 1;

	var player1 = '#playdeck';
	var scrobbled = false;
	var timerid = 0;

	$scope.nextTrack = function() {
		var next = getNextSong();
		if (next) {
			$scope.playSong(false, next);
		}
	};

	$scope.previousTrack = function() {
		var next = getNextSong(true);
		if (next) {
			$scope.playSong(false, next);
		}
	};

	getNextSong = function(previous) {

		var song;

		$log.debug('Getting Next Song > ' + 'Queue length: ' + $rootScope.queue.length);

		if ($rootScope.queue.length > 0) {
			angular.forEach($rootScope.queue, function(item, key) {
				if (item.playing === true) {
					song = item;
				}
			});
			var index = $rootScope.queue.indexOf(song);
			var next;
			if (previous) {
				next = $rootScope.queue[index - 1];
			}
			else {
				next = $rootScope.queue[index + 1];
			}
			if (typeof next != 'undefined') {
				$log.debug('Next Song: ' + next.id);
				return next;
			}
			else {
				return false;
			}
		}
		else {
			return false;
		}
	};

	startSaveTrackPosition = function() {

		if (timerid !== 0) {
			clearInterval(timerid);
		}

		timerid = $window.setInterval(function() {
			if (globals.settings.SaveTrackPosition)
				saveTrackPosition();
		}, 500);
	};

	saveTrackPosition = function() {
		if ($rootScope.playingSong) {

			// save song and elapsed time
			$rootScope.playingSong.position = Math.floor($scope.player.media.currentTime);
			utils.setValue('CurrentSong', $rootScope.playingSong);

			// Save Queue
			utils.setValue('CurrentQueue', $rootScope.queue);
		}
	};

	deleteCurrentQueue = function(data) {

		utils.setValue('CurrentQueue', null, false);
		utils.setValue('CurrentSong', null, false);

		$log.debug('Removing Play Queue');
	};


	$scope.$on('playSong', function(event, args){
		$log.debug('playSong Event');
		$log.debug(event);
		$log.debug(args);
		$scope.playSong(args.loadonly, args.song);
	});

	$scope.playSong = function(loadonly, song) {

		angular.forEach($rootScope.queue, function(item, key) {
			item.playing = false;
		});

		song.playing = true;
		song.selected = false;

		$rootScope.playingSong = song;
		$log.debug(song.specs);
		$scope.specs = $sce.trustAsHtml(song.specs);

		$scope.player.pause();
		$scope.player.setSrc(song.url);
		$scope.player.load();

		$scope.player.media.addEventListener('loadeddata', function(e){
			$log.debug('loaded and set to: ' + song.position);
			$scope.player.setCurrentTime(song.position);
		});

		if (!loadonly) {
			$scope.player.play();
			$rootScope.playingSong.playing = true;
			// Sway.fm UnityShim
			if ($rootScope.unity) {
				$rootScope.unity.sendState({
					playing: true,
					title: song.name,
					artist: song.artist,
					favorite: false,
					albumArt: song.coverartfull
				});
			}
			// End UnityShim
			
		}

		// scroll to playing
		$('#Queue').stop().scrollTo('#' + song.id, 400);

		if (globals.settings.NotificationSong && !loadonly) {
			notifications.showNotification(song.coverartthumb, utils.toHTML.un(song.name), utils.toHTML.un(song.artist + ' - ' + song.album), 'text', '#NextTrack');
		}

		if (globals.settings.ScrollTitle) {
			var title = utils.toHTML.un(song.artist) + ' - ' + utils.toHTML.un(song.name);
			utils.scrollTitle(title);
		}
		else {
			utils.setTitle(utils.toHTML.un(song.artist) + ' - ' + utils.toHTML.un(song.name));
		}

	};

	$rootScope.playPauseSong = function() {
		$scope.playPauseSong();
	};

	$scope.playPauseSong = function() {
		if ($scope.player.media.paused) {
			$scope.player.play();
		}
		else {
			$scope.player.pause();
		}
	};

	scrobbleSong = function(submission) {
		if ($rootScope.loggedIn && submission) {
			var id = $rootScope.playingSong.id;

			$log.debug('Scrobble Song: ' + id);

			$http
				.jsonp(globals.BaseURL() + '/scrobble.view?' + globals.BaseParams() + '&id=' + id + "&submission=" + submission)
				.success(function() {
					scrobbled = true;
				});
		}
	};

	rateSong = function(songid, rating) {
		$http
			.get(baseURL + '/setRating.view?' + baseParams + '&id=' + songid + "&rating=" + rating)
			.success(function() {
				updateMessage('Rating Updated!', true);
			});
	};

	// Sway.fm Unity Plugin
	$rootScope.unity = UnityMusicShim();
	$rootScope.unity.setSupports({
		playpause: true,
		next: true,
		previous: true
	});

	$rootScope.unity.setCallbackObject({
		pause: function() {
			if (globals.settings.Debug) {
				console.log("Unity: Recieved playpause command");
			}
			playPauseSong();
		},
		next: function() {
			if (globals.settings.Debug) {
				console.log("Unity: Recieved next command");
			}
			$scope.nextTrack();
		},
		previous: function() {
			if (globals.settings.Debug) {
				console.log("Unity: Recieved previous command");
			}
			$scope.previousTrack();
		}
	});

	$scope.player = new MediaElementPlayer('#audiojs', {
		startVolume: $rootScope.volume,
		features: [],
		plugins: ['flash', 'silverlight'],
		pluginPath: '/js/',
		AndroidUseNativeControls: true,
		success: function(mediaElement, domObject){
			mediaElement.addEventListener('timeupdate', function(e){
				$('#currentTime').html(secondsToTime(mediaElement.currentTime, true));
				$('#progress_completed').css("width", function(){
					return Math.floor($('#progress').width() * (mediaElement.currentTime/$rootScope.playingSong.duration));
				});
			});
			mediaElement.addEventListener('ended', function(event) {
				if (globals.settings.Repeat) { // Repeat current track if enabled
					mediaElement.setCurrentTime(0);
					mediaElement.play();
				}
				else {
					if (!getNextSong()) { // Action if we are at the last song in queue
						if (globals.settings.LoopQueue) { // Loop to first track in queue if enabled
							var next = $rootScope.queue[0];
							$scope.playSong(false, next);
						}
						else if (globals.settings.AutoPlay) { // Load more tracks if enabled
							$rootScope.getRandomSongs('play', '', '');
							notifications.updateMessage('Auto Play Activated...', true);
						}
					}
					else {
						$scope.nextTrack();
					}
				}
			});
		}
	});

	$scope.seek = function(e){
		var seek = (e.pageX - $('#progress').position().left);
		var seek_secs = (seek / $('#progress').width() * $rootScope.playingSong.duration);
		$log.debug('seek requested: ' + seek_secs);
		$scope.player.media.setCurrentTime(seek_secs);
	};

	startSaveTrackPosition();

});
