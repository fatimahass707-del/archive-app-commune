import { useState, useEffect } from "react";

export default function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isDismissed, setIsDismissed] = useState(
    localStorage.getItem("pwa_install_dismissed") === "true"
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      if (!isDismissed) {
        setInstallPrompt(e);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [isDismissed]);

  const triggerInstall = async () => {
    if (!installPrompt) return false;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
      return true;
    } else {
      handleDismiss();
      return false;
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa_install_dismissed", "true");
    setIsDismissed(true);
    setInstallPrompt(null);
  };

  return {
    showButton: installPrompt !== null,
    triggerInstall,
    handleDismiss,
  };
}
