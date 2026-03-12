import { useEffect, useRef, useState } from 'react';
import type React from 'react';

export const useDownloadMenu = () => {
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
    const [exportScale, setExportScale] = useState(2);
    const [exportQuality, setExportQuality] = useState(0.92);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

    const downloadMenuRef = useRef<HTMLDivElement>(null);
    const downloadButtonRef = useRef<HTMLButtonElement>(null);

    const toggleDownloadMenu = () => {
        if (!showDownloadMenu && downloadButtonRef.current) {
            const rect = downloadButtonRef.current.getBoundingClientRect();
            const isBottomHalf = rect.top > window.innerHeight / 2;
            const isRightHalf = rect.left > window.innerWidth / 2;

            setMenuStyle({
                position: 'fixed',
                zIndex: 9999,
                top: isBottomHalf ? rect.top - 8 : rect.bottom + 8,
                left: isRightHalf ? rect.right : rect.left,
                transform: `translate(${isRightHalf ? '-100%' : '0'}, ${isBottomHalf ? '-100%' : '0'})`,
                pointerEvents: 'none'
            });
        }

        setShowDownloadMenu((prev) => !prev);
        if (showDownloadMenu) setShowSettings(false);
    };

    useEffect(() => {
        const handleClose = (event: MouseEvent | Event) => {
            if (!showDownloadMenu) return;
            if (!(event instanceof MouseEvent)) {
                setShowDownloadMenu(false);
                setShowSettings(false);
                return;
            }

            const isInsideMenu = downloadMenuRef.current?.contains(event.target as Node);
            const isInsideButton = downloadButtonRef.current?.contains(event.target as Node);
            if (!isInsideMenu && !isInsideButton) {
                setShowDownloadMenu(false);
                setShowSettings(false);
            }
        };

        document.addEventListener('mousedown', handleClose);
        window.addEventListener('scroll', handleClose, true);
        return () => {
            document.removeEventListener('mousedown', handleClose);
            window.removeEventListener('scroll', handleClose, true);
        };
    }, [showDownloadMenu]);

    return {
        showDownloadMenu,
        setShowDownloadMenu,
        showSettings,
        setShowSettings,
        exportFormat,
        setExportFormat,
        exportScale,
        setExportScale,
        exportQuality,
        setExportQuality,
        menuStyle,
        downloadMenuRef,
        downloadButtonRef,
        toggleDownloadMenu
    };
};
