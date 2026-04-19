/**
 * printWithTitle — sets the Tauri window title before printing so WebView2's
 * "Save Print Output As" dialog pre-fills the correct filename.
 * Falls back to document.title for non-Tauri environments.
 *
 * @param {string} title   The desired filename (without extension)
 * @param {Function} [fn]  Optional custom print function (e.g. for iframes)
 */
export const printWithTitle = async (title, fn = null) => {
    const doPrint = fn || (() => window.print());
    try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();
        await win.setTitle(title);
        doPrint();
        // Restore after the print dialog closes (print() is synchronous/blocking)
        win.setTitle('Tezaura').catch(() => {});
    } catch {
        // Non-Tauri fallback
        const prev = document.title;
        document.title = title;
        doPrint();
        document.title = prev;
    }
};
