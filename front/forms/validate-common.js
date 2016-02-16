import { createErrorAction } from '../actions';

/**
 * Apply common validations to an HTML input, based on its attributes. Contextual validation logic should be defined in a specific file.
 * @param  {HTMLInputElement} input The input to validate.
 * @return {Action?}          Either nothing if no validation errors were found or an ERROR type redux Action.
 */
export default function validateCommon(input) {
    if (input.required && ! input.value)
        return createErrorAction(input.name, 'required', input.value);
}