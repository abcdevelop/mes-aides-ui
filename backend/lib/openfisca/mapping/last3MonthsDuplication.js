var common = require('./common');

var familleProperties = [
    'parisien',
    'proprietaire_proche_famille',
    'rsa_isolement_recent',
];

var individuProperties = [
    'activite',
    'age',
    'age_en_mois',
    'ass_precondition_remplie',
    'boursier',
    'date_arret_de_travail',
    'date_naissance',
    'echelon_bourse',
    'enceinte',
    'enfant_place',
    'etudiant',
    'garde_alternee',
    'habite_chez_parents',
    'handicap',
    'inapte_travail',
    'perte_autonomie',
    'scolarite',
    'statut_marital',
    'taux_incapacite',
    'tns_auto_entrepreneur_type_activite',
    'tns_autres_revenus_type_activite',
    'tns_micro_entreprise_type_activite',
];

var menageProperties = [
    'charges_locatives',
    'coloc',
    'depcom',
    'logement_chambre',
    'loyer',
    'participation_frais',
    'statut_occupation_logement',
];

function copyTo3PreviousMonths(testCase, dateDeValeur) {
    var periodKeys = ['thisMonth', '1MonthsAgo', '2MonthsAgo', '3MonthsAgo'];
    var periods = common.getPeriods(dateDeValeur);

    var forDuplication = {
        familles: familleProperties,
        individus: individuProperties,
        menages: menageProperties,
    };
    Object.keys(forDuplication).forEach(function(entityName) {
        forDuplication[entityName].forEach(function(entityPropertyName) {
            testCase[entityName].forEach(function(entity) {
                var value = entity[entityPropertyName];
                var result = {};
                if (value !== undefined) {
                    periodKeys.forEach(function(periodKey) {
                        result[periods[periodKey]] = value;
                    });
                    entity[entityPropertyName] = result;
                }
            });
        });
    });
}

module.exports = copyTo3PreviousMonths;
