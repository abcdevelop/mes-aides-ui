'use strict';

var DATE_FIELDS = ['date_naissance', 'date_arret_de_travail', 'dateDernierContratTravail'];

angular.module('ddsCommon').factory('SituationService', function($http, $sessionStorage, categoriesRnc, patrimoineTypes, RessourceService) {
    var situation;

    function adaptPersistedIndividu(individu) {
        DATE_FIELDS.forEach(function(dateField) {
            if (individu[dateField]) {
                individu[dateField] = moment(new Date(individu[dateField]));
            }
        });

        individu.hasRessources = ! _.isEmpty(RessourceService.extractIndividuSelectedRessourceTypes(individu));
    }

    function adaptPersistedSituation(situation) {
        situation.dateDeValeur = new Date(situation.dateDeValeur);
        situation.individus.forEach(adaptPersistedIndividu);
        return situation;
    }

    function saveLocally(persistedSituation) {
        situation = $sessionStorage.situation = persistedSituation;
        return adaptPersistedSituation(persistedSituation);
    }

    return {
        newSituation: function() {
            situation = $sessionStorage.situation = {
                individus: [],
                dateDeValeur: moment().format(),
                famille: {},
                foyer_fiscal: {},
                menage: {},
            };
        },

        restoreLocal: function() {
            if (! situation) {
                situation = $sessionStorage.situation;
            }

            if (! situation) {
                this.newSituation();
            }

            return adaptPersistedSituation(situation);
        },

        restoreRemote: function(situationId) {
            return $http.get('/api/situations/' + situationId, {
                params: { cacheBust: Date.now() }
            })
            .then(function(result) { return result.data; })
            .then(saveLocally);
        },

        save: function(situation) {
            if (situation._id) {
                situation.modifiedFrom = situation._id;
                delete situation._id;
            }
            return $http.post('/api/situations/', situation)
            .then(function(result) { return result.data; })
            .then(saveLocally);
        },

        /**
        *@param    {String}  A situation model to send to the backend
        *@return   {String}  A boolean indicating whether the situation looks ready for OpenFisca or not
        */
        passSanityCheck: function(situation) {
            return situation.individus && situation.individus.length;
        },

        getDemandeur: function(situation) {
            return _.find(situation.individus, { role: 'demandeur' });
        },

        getConjoint: function(situation) {
            return _.find(situation.individus, { role: 'conjoint' });
        },

        getEnfants: function(situation) {
            return _.filter(situation.individus, { role: 'enfant' });
        },

        getIndividusSortedParentsFirst: function(situation) {
            return [].concat(
                this.getDemandeur(situation),
                this.getConjoint(situation),
                this.getEnfants(situation)
            ).filter(function(individu) { return individu; });
        },

        hasEnfantScolarise: function(situation) {
            return _.some(situation.individus, { role: 'enfant', scolarite: 'Collège' }) || _.some(situation.individus, { role: 'enfant', scolarite: 'Lycée' });
        },

        hasEnfant: function(situation) {
            return _.some(situation.individus, { role: 'enfant' });
        },

        setConjoint: function(situation, conjoint) {
            var individus = situation.individus;
            // si le conjoint existait déjà avant, on l'écrase
            if (this.getConjoint(situation)) {
                individus[individus.length - 1] = conjoint;
            } else {
                // on insère le conjoint en dernier dans la liste des individus
                individus.push(conjoint);
            }
        },

        setEnfants: function(situation, enfants) {
            var individus = situation.individus;
            individus = _.filter(individus, function(individu) {
                return 'enfant' !== individu.role;
            });
            individus = individus.slice(0,1)
                .concat(enfants)
                .concat(individus.slice(1));
            situation.individus = individus;
        },

        ressourcesYearMoins2Captured: function(situation) {
            var yearMoins2 = moment(situation.dateDeValeur).subtract('years', 2).format('YYYY');
            var januaryYearMoins2 = moment(yearMoins2).format('YYYY-MM');
            var rfr = situation.foyer_fiscal && situation.foyer_fiscal.rfr && situation.foyer_fiscal.rfr[yearMoins2];
            var hasYm2Ressources = situation.individus.some(function(individu) {
                return categoriesRnc.reduce(function(hasYm2RessourcesAccum, categorieRnc) {
                    if (! individu[categorieRnc.id]) {
                        return hasYm2RessourcesAccum;
                    }

                    return hasYm2RessourcesAccum ||
                        typeof individu[categorieRnc.id][yearMoins2] == 'number' ||
                        typeof individu[categorieRnc.id][januaryYearMoins2] == 'number';
                }, false);
            });
            return typeof rfr == 'number' || hasYm2Ressources;
        },

        /* This function returns
         * - undefined if demandeur do not have any patrimoine ressource
         * - false if those ressources are all null else
         * - true
         */
        hasPatrimoine: function(situation) {
            var demandeur = situation.individus[0];
            return patrimoineTypes.reduce(function(accum, ressource) {
                if (! demandeur[ressource.id]) {
                    return accum;
                }

                return accum || _.some(_.values(demandeur[ressource.id]));

            }, undefined);
        },
    };
});
