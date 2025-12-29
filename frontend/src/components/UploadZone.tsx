"use client";

import React, { useState, useCallback } from "react";
import { Upload, X, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";

interface UploadZoneProps {
    onUploadSuccess: (data: any) => void;
}

export function UploadZone({ onUploadSuccess }: UploadZoneProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setError(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "text/csv": [".csv"],
        },
        multiple: false,
    });

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("http://localhost:8000/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Upload fehlgeschlagen");
            }

            const data = await response.json();
            onUploadSuccess(data);
            setFile(null);
        } catch (err: any) {
            setError(err.message || "Ein Fehler ist aufgetreten");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div
                {...getRootProps()}
                className={`relative group border-2 border-dashed rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer
          ${isDragActive
                        ? "border-blue-500 bg-blue-500/5"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm"
                    }`}
            >
                <input {...getInputProps()} />

                <div className="bg-blue-500/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="text-blue-600 dark:text-blue-400" size={32} />
                </div>

                {file ? (
                    <div className="text-center space-y-2">
                        <p className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
                            <CheckCircle2 size={18} /> {file.name}
                        </p>
                        <p className="text-sm text-zinc-500">Klicke zum Ändern oder drücke "Analyse starten"</p>
                    </div>
                ) : (
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold">DKB CSV hier ablegen</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Oder klicken, um eine Datei auszuwählen
                        </p>
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-lg text-sm flex items-center gap-2">
                        <X size={16} /> {error}
                    </div>
                )}
            </div>

            {file && (
                <div className="mt-6 flex justify-center">
                    <Button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl text-lg font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Analyse läuft...
                            </>
                        ) : (
                            "Analyse starten"
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
