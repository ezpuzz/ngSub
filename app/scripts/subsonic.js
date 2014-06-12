ngSub.factory('Artist', ['$resource', 'globals',
	function($resource, globals) {
		return $resource(globals.BaseURL() + '/getArtist.view', globals.defaultParams(), {
			get: {
				method: 'JSONP'
			},
			list: {
				method: 'JSONP',
				url: globals.BaseURL() + '/getArtists.view'
			}
		});

	}
]);

ngSub.factory('Album', ['$resource', 'globals',
	function($resource, globals) {
		return $resource(globals.BaseURL() + '/getAlbum.view', globals.defaultParams(), {
			get: {
				method: 'JSONP'
			},
			list: {
				method: 'JSONP',
				url: globals.BaseURL() + '/getAlbumList2.view'
			}
		});

	}
]);

ngSub.factory('Folders', ['$resource', 'globals',
	function($resource, globals) {
		return $resource(globals.BaseURL() + '/getMusicDirectory.view', globals.defaultParams(), {
			get: {
				method: 'JSONP'
			},
			list: {
				method: 'JSONP',
				url: globals.BaseURL() + '/getMusicFolders.view'
			}
		});

	}
]);

ngSub.factory('Playlists', ['$resource', 'globals',
	function($resource, globals) {
		return $resource(globals.BaseURL() + '/getPlaylists.view', globals.defaultParams(), {
			get: {
				method: 'JSONP'
			},
			update: {
				method: 'JSONP',
				url: globals.BaseURL() + '/updatePlaylist.view'
			}
		});

	}
]);
