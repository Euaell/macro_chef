'use client';
import React from "react";


export default function TableHeaderCell({ children }: Readonly<{ children: React.ReactNode }>) {

	
	return (
		<th className="hover:bg-gray-200 cursor-pointer">
			{children}
			<i className="ml-2 ri-arrow-up-down-line"></i>
		</th>
	)
}
