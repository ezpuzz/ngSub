var ngSub = angular.module('ngSub', ['ngResource', 'ngSanitize', 'ui.router', 'monospaced.mousewheel']);

ngSub.config(
	['$locationProvider', '$stateProvider', '$urlRouterProvider', '$uiViewScrollProvider',
		function($locationProvider, $stateProvider, $urlRouterProvider, $uiViewScrollProvider) {

			$urlRouterProvider.otherwise('/library/recent/0');
			$uiViewScrollProvider.useAnchorScroll();

			$stateProvider
				.state('library', {
					url: '/library',
					views: {
						'main': {
							controller: 'SubsonicCtrl',
							templateUrl: '/partials/library.html'
						}
					},
					resolve: {
						settings: function(utils, $log, $q, globals) {
							var deferred = $q.defer();
							utils.getValue('Settings', function(s) {
								$log.debug('SETTINGS LOADED');

								if(s !== null)
								{
									globals.settings = s;
								}
								else
									s = globals.settings;

								deferred.resolve(s);
							});
							return deferred.promise;
						},
						artists: function(utils, $log, $q, $rootScope) {
							var deferred = $q.defer();
							utils.getValue('Artists', function(s) {
								$log.debug('ARTISTS LOADED');
								if(!s)
								{
									s = [];
								}
								deferred.resolve(s);
							});
							return deferred.promise;
						}
					}
				})
				.state('library.recent', {
					url: '/recent/:offset',
					views: {
						'albums': {
							templateUrl: '/partials/albums.html',
							controller: function($scope, $log, $stateParams) {

								if (isNaN($stateParams.offset) || $stateParams.offset === '') {
									$log.debug('calculating offset');
									return;
								}
								else if (!isNaN(parseInt($stateParams.offset))) {
									$log.debug('numeric offset: ' + $stateParams.offset);
									$scope.$parent.offset = parseInt($stateParams.offset);
								}

								$log.debug('loading recently added with offset: ' + $stateParams.offset);
								$scope.getAlbumListBy('newest', $stateParams.offset);

							}
						}
					}
				})
				.state('library.recent.album', {
					url: '/:albumId',
					views: {
						'songs': {
							templateUrl: '/partials/songs.html',
							controller: function($scope, $stateParams, $log, Album) {
								$log.debug('loading recently added with album: ' + $stateParams.albumId);
								$scope.getSongs($stateParams.albumId, '');
							}
						}
					}
				})
				.state('library.random', {
					url: '/random',
					views: {
						'albums': {
							templateUrl: '/partials/albums.html',
							controller: function($scope, $log, $stateParams) {

								$log.debug('loading random albums: ' + $stateParams.offset);
								$scope.getAlbumListBy('random', $stateParams.offset);

							}
						}
					}
				})
				.state('library.random.album', {
					url: '/:albumId',
					views: {
						'songs': {
							templateUrl: '/partials/songs.html',
							controller: function($scope, $stateParams, $log, Album) {
								$log.debug('loading recently added with album: ' + $stateParams.albumId);
								$scope.getSongs($stateParams.albumId, '');
							}
						}
					}
				})
				.state('library.artist', {
					url: '/:artistId',
					views: {
						'albums': {
							templateUrl: '/partials/albums.html',
							controller: function($scope, $stateParams, $log) {
								$log.debug('Loading Artist');
								$log.debug(angular.toJson($stateParams));
								if ($stateParams.artistId.length > 0) {
									$scope.getAlbums({
										id: $stateParams.artistId
									});
								}
							}
						}
					}
				})
				.state('library.artist.album', {
					url: '/:albumId',
					views: {
						'songs': {
							templateUrl: '/partials/songs.html',
							controller: function($scope, $stateParams, $log, Album) {
								$log.debug(angular.toJson($stateParams));

								if ($stateParams.albumId.length > 0) {
									$scope.getSongs($stateParams.albumId, '');
								}
							}
						}
					}

				})
				.state('playlists', {
					url: '/playlists',
					views: {
						'main': {
							templateUrl: '/partials/playlists.html',
							controller: 'PlaylistCtrl'
						}
					},
					resolve: {
						settings: function(utils, $log, $q, globals) {
							var deferred = $q.defer();
							utils.getValue('Settings', function(s) {
								$log.debug('SETTINGS LOADED');

								if(s !== null)
								{
									globals.settings = s;
								}
								else
									s = globals.settings;

								deferred.resolve(s);
							});
							return deferred.promise;
						},
						artists: function(utils, $log, $q, $rootScope) {
							var deferred = $q.defer();
							utils.getValue('Artists', function(s) {
								$log.debug('ARTISTS LOADED');
								if(!s)
								{
									s = [];
								}
								deferred.resolve(s);
							});
							return deferred.promise;
						}
					}
				})
				.state('settings', {
					url: '/settings',
					views: {
						'main': {
							templateUrl: '/partials/settings.html',
							controller: 'SettingsCtrl',
						}
					},
					resolve: {
						settings: function(utils, $log, $q, globals) {
							var deferred = $q.defer();
							utils.getValue('Settings', function(s) {
								$log.debug('SETTINGS LOADED');
								if(s !== null)
								{
									globals.settings = s;
								}
								else
									s = globals.settings;

								deferred.resolve(s);
							});
							return deferred.promise;
						}
					}
				});

			$locationProvider.html5Mode(true);

		}
	])
	.run(
		['$rootScope', 'globals', 'utils', '$state', '$log',
			function($rootScope, globals, utils, $state, $log) {

				try {
					utils.getValue('Volume', function(v) {
						if (v !== null) {
							$rootScope.volume = v;
						}
					});

					utils.loadTrackPosition();
				}
				catch (err) {
					$log.debug(err);
					utils.setValue('CurrentSong', null);
					utils.setValue('CurrentQueue', null);
					utils.setValue('Settings', null);
					utils.setValue('Artists', null);
				}

				$rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
					$log.debug(error);
				});

				$rootScope.loggedIn = false;

				if (globals.settings.Username !== '' && globals.settings.Password !== '' && globals.settings.Server !== '' && !$state.includes('archive')) {
					$rootScope.loggedIn = true;
				}
				if (!$rootScope.loggedIn && (!$state.includes('settings') && !$state.includes('archive'))) {
					$state.go('settings');
				}

			}
		]);
