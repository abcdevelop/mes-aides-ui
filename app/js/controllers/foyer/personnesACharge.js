'use strict';

angular.module('ddsApp').controller('FoyerPersonnesAChargeCtrl', function ($scope, $rootScope, SituationService) {
    $scope.situation = SituationService.restoreLocal();
    $scope.nationaliteLabels = SituationService.nationaliteLabels;

    if (!$scope.situation.personnesACharge) {
        $scope.situation.personnesACharge = [];
    }

    if ($scope.situation.childConfigDone) {
        $scope.visible = true;
    }

    $rootScope.$on('enfants', function() {
        $scope.visible = true;
    });

    $scope.removePersonneACharge = function(personne) {
        var index = $scope.situation.personnesACharge.indexOf(personne);
        $scope.situation.personnesACharge.splice(index, 1);
        if (0 === $scope.situation.personnesACharge.length) {
            $scope.situation.hasPersonnesACharge = undefined;
        }
    };

    $scope.endPersonnesAChargeConfig = function() {
        $scope.situation.personnesAChargeConfigDone = true;
        $scope.$emit('personnesACharge', $scope.situation.personnesACharge);
        if ($scope.situation.personnesACharge.length === 0) {
            $scope.situation.hasPersonnesACharge = false;
        }
    };
});