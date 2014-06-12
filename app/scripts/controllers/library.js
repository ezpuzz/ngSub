ngSub.controller('SubsonicCtrl', function SubsonicCtrl($scope, $rootScope, $stateParams, utils, globals, model, notifications, $http, $state, $log, Album, Folders, Playlists, Artist, $window, settings, artists) {

	/*
	 * songlist songs
	 */
	$scope.selectedSongs = [];
	$scope.shortcut = [];
	$scope.playlistMenu = [];
	$scope.BreadCrumbs = [];

	/*
	 * albumlist albums
	 */
	$scope.album = [];

	$scope.AutoAlbums = [{
		id: "starred",
		name: "Starred"
	}, {
		id: "highest",
		name: "Top Rated"
	}, {
		id: "frequent",
		name: "Most Played"
	}, {
		id: "recent",
		name: "Recently Played"
	}];

	$scope.selectedAutoAlbum = null;

	$scope.artists = artists;

	$scope.selectedArtist = null;
	$scope.selectedAlbum = null;

	$scope.offset = 0;

	$scope.AlbumDisplay = globals.Layouts;
	$scope.SelectedAlbumDisplay = $scope.AlbumDisplay[0];

	$scope.SearchType = settings.DefaultSearchType;
	$scope.SearchTypes = globals.SearchTypes;

	$scope.MusicFolders = [];
	$scope.SelectedMusicFolder = null;

	$scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams, error) {
		$log.debug(toState);
		$log.debug('Infinite Scroll Binding');
		var element = $('#albumlist');
		element.on('scroll mousedown wheel DOMMouseScroll mousewheel keyup', function(e) {
			var raw = element[0];
			if (raw.scrollLeft >= raw.scrollWidth * 0.7) {
				$scope.loadMoreAlbums();
			}
		});
	});

	$scope.albumWaiting = false;

	$scope.loadMoreAlbums = function() {
		if ($scope.albumWaiting === false) {
			$scope.albumWaiting = true;
			$log.debug('loading more albums... (offset: ' + $scope.offset + ')');
			$scope.offset += settings.AutoAlbumSize;
			Album.list({
				"type": $scope.selectedAutoAlbum,
				"offset": $scope.offset,
				"size": settings.AutoAlbumSize
			}, function(data) {

				$scope.offset += settings.AutoAlbumSize;
				if (typeof data["subsonic-response"].albumList2.album != 'undefined') {

					angular.forEach(data['subsonic-response'].albumList2.album, function(item, key) {
						$scope.selectedArtist.album.push($scope.mapAlbum(item));
					});

				}
				else {
					notifications.updateMessage('No Albums Returned :(', true);
				}

				$log.debug('Albums finished loading, albumWaiting = false');
				$scope.albumWaiting = false;
			});
		}
	};

	$scope.getMusicFolders = function() {

		var data = Folders.list({}, function() {

			if (data["subsonic-response"].musicFolders.musicFolder !== undefined) {

				$scope.MusicFolders.length = 0;

				if (data["subsonic-response"].musicFolders.musicFolder.length > 0) {
					$scope.MusicFolders = data["subsonic-response"].musicFolders.musicFolder;
				}
				else {
					$scope.MusicFolders[0] = data["subsonic-response"].musicFolders.musicFolder;
				}

				utils.setValue('MusicFolders', $scope.MusicFolders);
			}
			else {
				$log.debug("No Music Folders :(");
			}

		});
	};

	$scope.rescanLibrary = function(data, event) {
		$http
			.jsonp(globals.BaseURL() + '/getUser.view?' + globals.BaseParams() + '&username=' + settings.Username)
			.success(function(data) {
				if (data["subsonic-response"].user.adminRole === true) {
					$.get(settings.Server + '/musicFolderSettings.view?scanNow');
				}
				else {
					alert('You are not logged in as an admin user!');
				}
			});
	};

	/*
	 * Some values may be arrays or single values
	 * such as artists on index
	 */
	$scope.mapArtist = function(data) {

		var artist = data.artist;
		var artists = [];
		if (artist.length > 0) {
			artists = artist;
			return {
				name: data.name,
				artist: artists
			};
		}
		else {
			artists[0] = artist;
			return {
				name: data.name,
				artist: artists
			};
		}
		return new model.Index(data.name, artists);
	};

	/*
	 * load the album list in left column
	 */
	$scope.getArtists = function(MusicFolderId) {

		var data = Artist.list({}, function() {

			var indexes = [];

			if (typeof data["subsonic-response"].artists.index != 'undefined') {
				if (data["subsonic-response"].artists.index.length > 0) {
					indexes = data["subsonic-response"].artists.index;
				}
				else {
					indexes[0] = data["subsonic-response"].artists.index;
				}
			}

			$scope.shortcut = [];
			var items = [];

			if (typeof data["subsonic-response"].indexes != 'undefined') {
				if (typeof data["subsonic-response"].indexes.shortcut != 'undefined') {
					if (data["subsonic-response"].indexes.shortcut.length > 0) {
						items = data["subsonic-response"].indexes.shortcut;
					}
					else {
						items[0] = data["subsonic-response"].indexes.shortcut;
					}
					angular.forEach(items, function(item, key) {
						$scope.shortcut.push(item);
					});
				}
			}

			$rootScope.index = [];
			$rootScope.index = indexes;
			$scope.artists = [];

			angular.forEach(indexes, function(indexValue, i) {
				$.merge($scope.artists, indexValue.artist);
			});

			utils.setValue('Artists', $scope.artists);
		});
	};

	$scope.refreshArtists = function(id) {
		$scope.getArtists();
	};

	$scope.mapAlbum = function(album) {

		var coverartthumb, coverartfull, starred;

		if (typeof album.coverArt != 'undefined') {
			coverartthumb = globals.BaseURL() + '/getCoverArt.view?' + globals.BaseParams() + '&size=300&id=' + album.coverArt;
			coverartfull = globals.BaseURL() + '/getCoverArt.view?' + globals.BaseParams() + '&id=' + album.coverArt;
		}

		if (typeof album.starred !== 'undefined') {
			starred = true;
		}
		else {
			starred = false;
		}
		if (typeof album.title !== 'undefined') {
			title = album.title;
		}
		else {
			title = album.name;
		}

		if (album.year === 0 || album.year == '0' || album.year === undefined)
			album.year = '';

		return {
			id: album.id,
			parentid: album.parent,
			name: title,
			artist: album.artist,
			artistId: album.artistId,
			coverartthumb: coverartthumb,
			coverartfull: coverartfull,
			date: $.format.date(new Date(album.created), "yyyy-MM-dd"),
			starred: starred,
			year: album.year,
			description: '',
			url: ''
		};
	};

	$scope.loadArtist = function(artist) {
		$state.go('library.artist', {
			"artistId": artist.id
		});
	};

	$scope.loadAlbum = function(id) {
		if ($state.includes('library.recent'))
			$state.go('library.recent.album', {
				"offset": $scope.offset,
				"albumId": id
			});
		else
			$state.go('library.artist.album', {
				"albumId": id
			});
	};

	/*
	 * Get albums by particular artist
	 */
	$scope.getAlbums = function(artist) {

		$log.debug('Getting albums for ' + artist.id);

		$scope.selectedAutoAlbum = null;

		$scope.selectedArtist = artist;

		$scope.BreadCrumbs.length = 0;
		$scope.BreadCrumbs.push(artist);

		var data = Artist.get({
			"id": artist.id
		}, function() {
			var items = [];

			$scope.selectedArtist = data['subsonic-response'].artist;

			var tempAlbums = [];

			if (data['subsonic-response'].artist.album.length > 0) {
				angular.forEach(data['subsonic-response'].artist.album, function(item, key) {
					$log.debug(JSON.stringify(item, null, 2));
					tempAlbums.push($scope.mapAlbum(item));
				});
			}
			else {
				$log.debug(JSON.stringify(data['subsonic-response'].artist.album));
				tempAlbums[0] = $scope.mapAlbum(data['subsonic-response'].artist.album);
			}


			$scope.selectedArtist.album = tempAlbums;
		});
	};

	/*
	 * Get Albums by AutoAlbums of type and page offset
	 */
	$scope.getAlbumListBy = function(type, offset) {

		$scope.albumWaiting = true;

		Album.list({
			"type": type,
			"offset": offset,
			"size": settings.AutoAlbumSize
		}, function(data) {

			if (typeof data["subsonic-response"].albumList2.album != 'undefined') {

				if ($scope.selectedAutoAlbum === null || type != $scope.selectedAutoAlbum) {
					$scope.selectedArtist = {
						album: []
					};
				}

				$scope.selectedAutoAlbum = type;
				$scope.selectedArtist.name = type;

				angular.forEach(data['subsonic-response'].albumList2.album, function(item, key) {
					$scope.selectedArtist.album.push($scope.mapAlbum(item));
				});

			}
			else {
				notifications.updateMessage('No Albums Returned :(', true);
			}

			$log.debug('Albums finished loading, albumWaiting = false');
			$scope.albumWaiting = false;
		});

	};

	$scope.getSongs = function(id, action) {

		var data = Album.get({
			"id": id
		}, function(data) {

			var items = data['subsonic-response'].album.song;

			$scope.selectedAlbum = data['subsonic-response'].album;

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

				$scope.playSong(false, $rootScope.queue[0]);

				notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);

			}
			else if (action == 'preview') {
				$scope.songpreview = [];
				angular.forEach(items, function(item, key) {
					if (!item.isDir) {
						$rootScope.songpreview.push(utils.mapSong(item));
					}
				});
			}

			var tempSongs = [];
			angular.forEach(items, function(item, key) {
				tempSongs.push(utils.mapSong(item));
			});

			$scope.selectedAlbum.song = tempSongs;

		});
	};


	$scope.toggleAZ = function(event) {
		$scope.toggleSubmenu('#submenu_AZIndex', '#AZIndex', 'right', 44);
	};

	$scope.loadPlaylistsForMenu = function(data, event) {

		data = Playlists.get({}, function() {

			var playlists = [];
			$scope.playlistMenu = [];

			if (typeof data["subsonic-response"].playlists.playlist != 'undefined') {

				if (data["subsonic-response"].playlists.playlist.length > 0) {
					playlists = data["subsonic-response"].playlists.playlist;
				}
				else {
					playlists[0] = data["subsonic-response"].playlists.playlist;
				}

				angular.forEach(playlists, function(item, key) {
					if (item.owner == settings.Username) {
						$scope.playlistMenu.push(item);
					}
				});

				if ($scope.playlistMenu.length > 0) {
					// TODO
					$scope.toggleSubmenu('#submenu_AddToPlaylist', '#action_AddToPlaylist', 'left', 124);
				}
				else {
					notifications.updateMessage('No Playlists :(', true);
				}
			}
		});
	};

	$scope.addToPlaylist = function() {

		var songs = [];

		if ($scope.selectedSongs.length !== 0) {
			angular.forEach($scope.selectedSongs, function(item, key) {
				songs.push(item.id);
			});

			var runningVersion = utils.parseVersionString(settings.ApiVersion);
			var minimumVersion = utils.parseVersionString('1.8.0');

			if (utils.checkVersion(runningVersion, minimumVersion)) { // is 1.8.0 or newer

				Playlists.update({
					"songIdToAdd": songs
				}, function() {
					$scope.selectedSongs.length = 0;
					notifications.updateMessage('Playlist Updated!', true);
				});
			}
		}
	};

	/*
	 *    $scope.getGenres = function() {
	 *        var genres = 'Acid Rock,Acoustic,Alt Country,Alt/Indie,Alternative & Punk,Alternative Metal,Alternative,AlternRock,Awesome,Bluegrass,Blues,Blues-Rock,Classic Hard Rock,Classic Rock,Comedy,Country,Country-Rock,Dance,Dance-Rock,Deep Funk,Easy Listening,Electronic,Electronica,Electronica/Dance,Folk,Folk/Rock,Funk,Grunge,Hard Rock,Heavy Metal,Holiday,House,Improg,Indie Rock,Indie,International,Irish,Jam Band,Jam,Jazz Fusion,Jazz,Latin,Live Albums,Metal,Music,Oldies,Other,Pop,Pop/Rock,Post Rock,Progressive Rock,Psychedelic Rock,Psychedelic,Punk,R&B,Rap & Hip-Hop,Reggae,Rock & Roll,Rock,Rock/Pop,Roots,Ska,Soft Rock,Soul,Southern Rock,Thrash Metal,Unknown,Vocal,World';
	 *        $rootScope.Genres = genres.split(',');
	 *    [> This is broken in version 4.8, unable to convert XML to JSON
	 *           $.ajax({
	 *url: globals.BaseURL() + '/getGenres.view?' + globals.BaseParams(),
	 *method: 'GET',
	 *dataType: settings.Protocol,
	 *timeout: settings.Timeout,
	 *success: function (data) {
	 *if (typeof data["subsonic-response"].genres != 'undefined') {
	 *var items = [];
	 *if (data["subsonic-response"].genres.length > 0) {
	 *items = data["subsonic-response"].genres;
	 *} else {
	 *items[0] = data["subsonic-response"].genres;
	 *}
	 *
	 *$rootScope.Genres = items;
	 *}
	 *}
	 *});
	 *
	 *    };
	 */

	$scope.selectSong = function(data) {
		var i = $scope.selectedSongs.indexOf(data);
		if (i >= 0) {
			$scope.selectedSongs.splice(i, 1);
			data.selected = false;
		}
		else {
			$scope.selectedSongs.push(data);
			data.selected = true;
		}
	};

	/*
	 * Queue and Play all songs in main window
	 */
	$scope.playAll = function() {
		$scope.selectAll();
		var next = $scope.addSongsToQueue();
		$scope.playSong(false, next);
	};

	$scope.playSong = function(load, s) {
		$rootScope.$broadcast('playSong', {
			'loadonly': load,
			'song': s
		});
	};

	/*
	 * Select all songs helper function
	 */
	$scope.selectAll = function() {
		angular.forEach($scope.selectedAlbum.song, function(item, key) {
			item.selected = true;
			$scope.selectedSongs.push(item);
		});
	};

	/*
	 * add selected songs in main window to Queue
	 */
	$scope.addSongsToQueue = function() {
		if ($scope.selectedSongs.length !== 0) {
			angular.forEach($scope.selectedSongs, function(item, key) {
				$scope.queue.push(item);
				item.selected = false;
			});

			notifications.updateMessage($scope.selectedSongs.length + ' Song(s) Added to Queue', true);

			var ret = $scope.selectedSongs[0];
			$scope.selectedSongs.length = 0;
			return ret;
		}
	};

	$scope.calcOffset = function(offset) {

		if (offset == 'next') {
			$log.debug('increment offset');
			$scope.offset += settings.AutoAlbumSize;
		}
		else if (offset == 'prev') {
			$log.debug('decrement offset');
			$scope.offset -= settings.AutoAlbumSize;
			if ($scope.offset < 0)
				$scope.offset = 0;
		}
		else if (!isNaN(offset) && offset > 0 && offset !== '') {
			$log.debug('numeric offset: ' + offset);
			$scope.offset = offset;
		}
		else {
			$log.debug('reset offset to 0');
			$scope.offset = 0;
		}

		$log.debug('reloading state ' + $state.current.name + ' with offset: ' + $scope.offset);

		$state.go($state.current.name, {
			offset: $scope.offset
		});
	};

	$rootScope.search = function() {
		var query = $('#Search').val();

		if (query !== '') {
			var type = $('#SearchType').val();
			$http
				.jsonp(globals.BaseURL() + '/search3.view?' + globals.BaseParams() + '&query=' + query)
				.success(function(data) {
					if (data["subsonic-response"].searchResult2 !== "") {
						var items = [];
						if (data["subsonic-response"].searchResult2.song !== undefined) {

							$scope.selectedAlbum = {name: 'Search Results For: ' + query};


							if (data["subsonic-response"].searchResult2.song.length > 0) {
								items = data["subsonic-response"].searchResult2.song;
							}
							else {
								items[0] = data["subsonic-response"].searchResult2.song;
							}

							$scope.selectedAlbum.song = [];

							angular.forEach(items, function(item, key) {
								$scope.selectedAlbum.song.push(utils.mapSong(item));
							});
						}
						if (data["subsonic-response"].searchResult2.album !== undefined) {
							if (data["subsonic-response"].searchResult2.album.length > 0) {
								items = data["subsonic-response"].searchResult2.album;
							}
							else {
								items[0] = data["subsonic-response"].searchResult2.album;
							}

							$scope.selectedArtist.album = [];

							angular.forEach(items, function(item, key) {
									$scope.selectedArtist.album.push($scope.mapAlbum(item));
							});
						}
						if (data["subsonic-response"].searchResult2.artist !== undefined) {
							if (data["subsonic-response"].searchResult2.artist.length > 0) {
								items = data["subsonic-response"].searchResult2.artist;
							}
							else {
								items[0] = data["subsonic-response"].searchResult2.artist;
							}
							angular.forEach(items, function(item, key) {
								$scope.shortcut.push(item);
							});
						}
					}
				});
		}
	};

	$scope.getMusicFolders();

});
