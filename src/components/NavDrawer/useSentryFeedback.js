import { useEffect, useRef } from "react";
import * as Sentry from "@sentry/react";

function labels(language) {
  const fr = language === "fr";
  return {
    triggerLabel: fr ? "Commentaires" : "Feedback",
    submitButtonLabel: fr ? "Envoyer" : "Send Feedback",
    formTitle: fr ? "Envoyer des commentaires" : "Send Feedback",
    cancelButtonLabel: fr ? "Annuler" : "Cancel",
    nameLabel: fr ? "Nom" : "Name",
    namePlaceholder: fr ? "Votre nom" : "Your name",
    emailLabel: fr ? "Courriel" : "Email",
    emailPlaceholder: fr
      ? "votre.courriel@exemple.com"
      : "your.email@example.com",
    messageLabel: fr ? "Description" : "Description",
    messagePlaceholder: fr
      ? "Quoi s'est-il passé ? Qu'attendiez-vous ?"
      : "What happened? What did you expect?",
    successMessageText: fr
      ? "Merci pour vos commentaires !"
      : "Thank you for your feedback!",
  };
}

// Attaches Sentry's feedback widget to a button and keeps it in step with the
// current language, region colour, and colour scheme. Returns the ref to put
// on the trigger button.
export default function useSentryFeedback({
  language,
  accentBackground,
  accentForeground,
  colorScheme,
}) {
  const buttonRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    const feedback = Sentry.getFeedback();
    const el = buttonRef.current;

    // Drop any widget from a previous render before attaching a new one.
    if (typeof widgetRef.current?.remove === "function") {
      widgetRef.current.remove();
      widgetRef.current = null;
    }

    if (feedback && el) {
      // Sentry takes literal colours; it can't read the theme's CSS variables.
      const themeColours = { accentBackground, accentForeground };
      widgetRef.current = feedback.attachTo(el, {
        ...labels(language),
        colorScheme,
        enableScreenshot: true,
        autoInject: false,
        onFormOpen: () => {
          // Sentry's backdrop ignores pointer events, so a click outside the
          // form does nothing until we turn them back on.
          setTimeout(() => {
            const backdrop = document.querySelector(
              "[data-sentry-feedback-backdrop]"
            );
            if (backdrop) backdrop.style.pointerEvents = "auto";
          }, 0);
        },
        themeLight: themeColours,
        themeDark: themeColours,
      });
    }

    return () => {
      if (typeof widgetRef.current?.remove === "function") {
        widgetRef.current.remove();
      }
    };
  }, [language, accentBackground, accentForeground, colorScheme]);

  return buttonRef;
}
