"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
	label: string;
	loading: React.ReactNode;
};

export default function SubmitButton({ label, loading }: SubmitButtonProps) {
	const { pending } = useFormStatus();

	return (
		<button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg">
			{pending ? loading : label}
		</button>
	)
}
