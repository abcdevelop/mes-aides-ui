'use strict';

angular.module('ddsApp').controller('FoyerRessourceYearMoins2Ctrl', function($scope, $state, categoriesRnc, IndividuService, SituationService, MonthService) {
    var today = $scope.situation.dateDeValeur;
    var months = MonthService.getMonths(today, 12);
    $scope.yearMoins2 = moment(today).subtract('years', 2).format('YYYY');
    $scope.debutAnneeGlissante = moment(today).subtract('years', 1).format('MMMM YYYY');

    $scope.individuRefsToDisplay = [];
    $scope.individuRefsToHide = [];
    SituationService.getIndividusSortedParentsFirst($scope.situation).forEach(function(individu) {
        var individuRef = {
            individu: individu,
            label: IndividuService.label(individu),
            rnc : categoriesRnc,
        };

        categoriesRnc.forEach(function(categorieRnc) {
            individu[categorieRnc.id] = individu[categorieRnc.id] || {};
        });

        var hasYM2Ressources = categoriesRnc.reduce(function(hasYM2RessourcesAccum, categorieRnc) {
            return hasYM2RessourcesAccum || typeof individu[categorieRnc.id][$scope.yearMoins2] == 'number';
        }, false);

        var display = IndividuService.isParent(individu) || hasYM2Ressources;
        (display ? $scope.individuRefsToDisplay : $scope.individuRefsToHide).push(individuRef);
    });

    $scope.display = function(individuRef) {
        $scope.individuRefsToDisplay.push(individuRef);
        $scope.individuRefsToHide = _.without($scope.individuRefsToHide, individuRef);
    };

    $scope.getDefaultValue = function(individuRef, rnc) {
        return _.sum((rnc.sources || []).map(function(sourceName) {
            if (! individuRef.individu[sourceName]) {
                return 0;
            }

            var ressource = individuRef.individu[sourceName];
            return months.reduce(function(sum, month) {
                if (! ressource[month.id]) {
                    return sum;
                }

                return sum + ressource[month.id];
            }, 0);
        }));
    };

    $scope.submit = function(form) {
        if (form && (! form.$valid))
            return;

        $scope.individuRefsToDisplay.forEach(function(individuRef) {
            var individu = individuRef.individu;

            // OpenFisca expects an integer for frais_reels and conversion is not done automatically
            var fraisReels = individu.frais_reels || {};
            if (fraisReels[$scope.yearMoins2]) {
                fraisReels[$scope.yearMoins2] = Math.round(fraisReels[$scope.yearMoins2]);
            }

            // nulls are zeroed in OpenFisca
            categoriesRnc.forEach(function(categorieRnc) {
                var ressource = individu[categorieRnc.id];
                if ($scope.yearMoins2 in ressource &&
                    (! _.isNumber(ressource[$scope.yearMoins2]))) {
                    delete ressource[$scope.yearMoins2];
                }
            });
        });

        $scope.$emit('rnc');
    };
});
