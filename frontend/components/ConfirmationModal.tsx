"use client";

import { useEffect } from "react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isLoading = false
}: ConfirmationModalProps) {
    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="card p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <i className="ri-error-warning-line text-2xl text-red-600" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-900 mb-1">{title}</h2>
                        <p className="text-slate-600">{message}</p>
                    </div>
                </div>

                <div className="flex gap-3 justify-end mt-6">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="btn-secondary"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="btn-primary !bg-red-600 hover:!bg-red-700"
                    >
                        {isLoading ? (
                            <>
                                <i className="ri-loader-4-line animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <i className="ri-delete-bin-line" />
                                {confirmText}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
