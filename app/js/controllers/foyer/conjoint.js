'use strict';

angular.module('ddsApp').controller('FoyerConjointCtrl', function($scope, $rootScope, SituationService) {
    $scope.situation = SituationService.restoreLocal();
    $scope.relationTypeLabels = SituationService.relationTypeLabels;
    $scope.nationaliteLabels = SituationService.nationaliteLabels;

    if ($scope.situation.demandeur) {
        $scope.visible = true;
    }

    $rootScope.$on('individu.demandeur', function() {
        $scope.visible = true;
    });

    $rootScope.$on('individu.conjoint', function(e, conjoint) {
        $scope.situation.conjoint = conjoint;
    });

    $scope.livesAlone = function() {
        $scope.$emit('individu.conjoint', null);
    };
});