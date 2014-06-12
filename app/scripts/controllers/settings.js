ngSub.controller('SettingsCtrl', function SettingsCtrl($scope, $rootScope, utils, globals, notifications, $log, settings) {

	$.each(globals.settings, function(i, v){
		if( ! settings[i] )
		{
			settings[i] = v;
		}
	});

	$rootScope.settings = settings;

	$scope.Timeouts = [
		{ id: 10000, name: 10 },
		{ id: 20000, name: 20 },
		{ id: 30000, name: 30 },
		{ id: 40000, name: 40 },
		{ id: 50000, name: 50 },
		{ id: 60000, name: 60 },
		{ id: 90000, name: 90 },
		{ id: 120000, name: 120 }
	];

	$scope.Themes = ["Default", "Dark"];

	$scope.SearchTypes = globals.SearchTypes;
	$scope.Layouts = globals.Layouts;

	$scope.$watch('settings.HideAZ', function () {
		if (settings.HideAZ) {
			$('#AZIndex').hide();
		} else {
			$('#AZIndex').show();
		}
	});

	$scope.$watch('settings', function(){
		$log.debug($scope.settings);
		$scope.save();
	}, true);

	$scope.save = function () {
		if (settings.Password !== '') { settings.encPassword = 'enc:' + utils.HexEncode(settings.Password); }

		if (settings.NotificationSong) {
			notifications.requestPermissionIfRequired();
			if (!notifications.hasNotificationPermission()) {
				alert('HTML5 Notifications are not available for your current browser, Sorry :(');
			}
		}

		if (settings.NotificationNowPlaying) {
			notifications.requestPermissionIfRequired();
			if (!notifications.hasNotificationPermission()) {
				alert('HTML5 Notifications are not available for your current browser, Sorry :(');
			}
		}

		if (settings.Theme) {
			utils.switchTheme(settings.Theme);
		}

		utils.setValue('Settings', settings);
		$rootScope.settings = settings;

		if (settings.Server !== '' && settings.Username !== '' && settings.Password !== '') {
			$scope.ping();
		}
	};

	$scope.toggleSetting = function (setting) {

		if (settings[setting]) {
			settings[setting] = false;
		} else {
			settings[setting] = true;
		}

	};
});
