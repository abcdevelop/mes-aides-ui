'use strict';

function formatDate(date) {
    return moment(date).format('YYYY-MM-DD');
}

function isIndividuValid(individu, situation) {
    var age = moment(situation.dateDeValeur).diff(moment(individu.dateDeNaissance), 'years');
    var handicap = individu.specificSituations.indexOf('handicap' ) >= 0;
    return individu.role != 'enfant' || age <= 25 || handicap;
}

function getEnfants(situation) {
    var enfants = _.filter(situation.individus, function(individu) {
        return isIndividuValid(individu, situation) && individu.role == 'enfant';
    });
    return _.map(enfants, 'id');
}

var familleSchema = {
    parents: {
        fn: function(situation) {
            return _.map(_.filter(situation.individus, function(individu) {
                return _.includes(['demandeur', 'conjoint'], individu.role);
            }), 'id');
        },
        copyTo3PreviousMonths: false,
    },
    enfants: {
        fn: getEnfants,
        copyTo3PreviousMonths: false,
    },
    proprietaire_proche_famille: {
        fn: function(situation) {
            return situation.logement.membreFamilleProprietaire;
        }
    },
    rsa_isolement_recent: {
        fn: function(situation) {
            return situation.individus[0].isolementRecent;
        }
    },
    parisien: {
        fn: function(situation) { return situation.logement.inhabitantForThreeYearsOutOfLastFive; }
    },
};

var foyerFiscalSchema = {
    declarants: {
        fn: function(situation) {
            return _.map(_.filter(situation.individus, function(individu) {
                return _.includes(['demandeur', 'conjoint'], individu.role);
            }), 'id');
        },
        copyTo3PreviousMonths: false,
    },
    // Today, in mes-aides, all children and only them are transmitted to Openfisca as personnes à charge
    personnes_a_charge: {
        fn: getEnfants,
        copyTo3PreviousMonths: false,
    },
    rfr: {
        fn: function (situation) {
            if (situation.ressourcesYearMoins2Captured && situation.rfr) {
                var anneeFiscaleN2 = moment(situation.dateDeValeur).subtract(2, 'years').year();
                var result = {};
                result[anneeFiscaleN2] = situation.rfr;
                return result;
            }
        },
        copyTo3PreviousMonths: false,
    },
};

var individuSchema = {
    date_naissance: {
        src: 'dateDeNaissance',
        fn: formatDate
    },
    age: {
        src: 'dateDeNaissance',
        fn: function (dateDeNaissance, individu, situation) {
            return moment(situation.dateDeValeur).diff(moment(dateDeNaissance), 'years');
        }
    },
    age_en_mois: {
        src: 'dateDeNaissance',
        fn: function (dateDeNaissance, individu, situation) {
            return moment(situation.dateDeValeur).diff(moment(dateDeNaissance), 'months');
        }
    },
    statut_marital: {
        src: 'statutMarital',
        values: {
            seul: 2,
            mariage: 1,
            pacs: 5,
            union_libre: 2
        }
    },
    id: {
        src: 'id',
        copyTo3PreviousMonths: false
    },
    enceinte: 'enceinte',
    ass_precondition_remplie: 'assPreconditionRemplie',
    date_arret_de_travail: {
        src: 'dateArretDeTravail',
        fn: formatDate
    },
    activite: {
        src: 'specificSituations',
        fn: function(value) {
            var returnValue;
            _.forEach({
                demandeur_emploi: 1,
                etudiant: 2,
                retraite: 3
            }, function(situationIndex, situation) {
                if (value.indexOf(situation) >= 0) {
                    returnValue = situationIndex;
                }
            });
            return returnValue;
        }
    },
    handicap: {
        src: 'specificSituations',
        fn: function(specificSituations) {
            return specificSituations.indexOf('handicap') >= 0;
        }
    },
    taux_incapacite: {
        fn: function(individu) {
            var handicap = individu.specificSituations.indexOf('handicap') >= 0;
            var tauxMap = {
                    moins50: 0.3,
                    moins80: 0.7,
                    plus80: 0.9
            };
            return handicap && tauxMap[individu.tauxIncapacite];
        }
    },
    inapte_travail: {
        src: 'specificSituations',
        fn: function(specificSituations) {
            return specificSituations.indexOf('inapte_travail') >= 0;
        }
    },
    perte_autonomie: 'perteAutonomie',
    etudiant: {
        src: 'specificSituations',
        fn: function(specificSituations) {
            return specificSituations.indexOf('etudiant') >= 0;
        }
    },
    boursier: {
        fn: function(individu) {
            return individu.boursier || individu.echelonBourse >= 0;  // backward compatibility for boursier; cannot write a migration because the exact echelon is not known
        }
    },
    echelon_bourse: 'echelonBourse',
    scolarite: {
        fn: function(individu) {
            var values = {
                'inconnue': 0,
                'college': 1,
                'lycee': 2
            };
            return values[individu.scolarite];
        }
    },
    enfant_a_charge: {
        // variable liée à l'année fiscale : on la définit sur l'année
        fn: function(individu, situation) {
            var year = moment(situation.dateDeValeur).format('YYYY');
            var result = {};
            result[year] = individu.aCharge || (! individu.fiscalementIndependant);
            return result;
        },
        copyTo3PreviousMonths: false,
    },
    enfant_place: 'place',
    garde_alternee: 'gardeAlternee',
    habite_chez_parents: 'habiteChezParents',

    /* Revenus du patrimoine */
    interets_epargne_sur_livrets: {
        src: 'epargneSurLivret',
        fn: function(value) {
            return {
                '2012-01': 0.01 * value || 0
            };
        },
        copyTo3PreviousMonths: false,
    },
    epargne_non_remuneree: {
        src: 'epargneSansRevenus',
        fn: function (value) {
            return {
                '2012-01': value || 0
            };
        },
        copyTo3PreviousMonths: false
    },
    valeur_locative_immo_non_loue: {
        src: 'valeurLocativeImmoNonLoue',
        fn: function (value) {
            return {
                '2012-01': value || 0
            };
        },
        copyTo3PreviousMonths: false,
    },
    valeur_locative_terrains_non_loue: {
        src: 'valeurLocativeTerrainNonLoue',
        fn: function (value) {
            return {
                '2012-01': value || 0
            };
        },
        copyTo3PreviousMonths: false,
    },

    /* Activités non-salarié */
    tns_autres_revenus_type_activite: 'tns_autres_revenus_type_activite',
    tns_auto_entrepreneur_type_activite: 'autoEntrepreneurActiviteType',
    tns_micro_entreprise_type_activite: 'microEntrepriseActiviteType',
};

var menageSchema = {
    personne_de_reference: {
        fn: function(situation) {
            return _.find(situation.individus, { role: 'demandeur' }).id;
        },
        copyTo3PreviousMonths: false,
    },
    conjoint: {
        fn: function(situation) {
            var conjoint = _.find(situation.individus, { role: 'conjoint' });
            return conjoint ? conjoint.id : null;
        },
        copyTo3PreviousMonths: false,
    },
    enfants: {
        fn: getEnfants,
        copyTo3PreviousMonths: false,
    },
    statut_occupation_logement: {
        fn: function(situation) {
            var statusOccupationMap = {
                'proprietaireprimoaccedant': 1,
                'proprietaire': 2,
                'locatairenonmeuble': 4,
                'locatairemeublehotel': 5,
                'heberge': 6,
                'locatairefoyer': 7,
                'sans_domicile' : 8
            };
            var logement = situation.logement;
            var type = logement.type;
            if (type) {
                var statusOccupationId = type;
                if (type == 'proprietaire' && logement.primoAccedant) {
                    statusOccupationId = 'proprietaireprimoaccedant';
                }
                if (type == 'locataire' && logement.locationType) {
                    statusOccupationId += logement.locationType;
                }
                return statusOccupationMap[statusOccupationId];
            }
        }
    },
    loyer: {
        fn: function (situation) { return situation.logement.loyer; },
        round: true
    },
    charges_locatives: {
        fn: function (situation) { return situation.logement.charges; },
        round: true
    },
    depcom: {
        fn: function (situation) { return situation.logement.adresse.codeInsee || null; }
    },
    participation_frais: {
        fn: function (situation) { return situation.logement.participationFrais; }
    },
    coloc: {
        fn: function (situation) {
            return situation.logement.type == 'locataire' && situation.logement.colocation;
        }
    },
    logement_chambre: {
        fn: function (situation) {
            return situation.logement.type == 'locataire' && situation.logement.isChambre;
        }
    },
};

angular.module('ddsCommon').constant('mappingSchemas', {
    isIndividuValid: isIndividuValid,

    famille: familleSchema,
    foyerFiscal: foyerFiscalSchema,
    individu: individuSchema,
    menage: menageSchema,
});