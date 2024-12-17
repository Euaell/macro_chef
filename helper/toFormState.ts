import { FormState } from "./FormErrorHandler";

export function toFormState(
	status: FormState['status'],
	message: string
): FormState {
	return {
		status,
		message,
		fieldErrors: {},
		timestamp: Date.now(),
	}
}
