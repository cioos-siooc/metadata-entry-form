import { localized, pick } from "../language";

/**
 * What a screen reader hears during a drag.
 *
 * dnd-kit ships English defaults, which in a bilingual app means a French user
 * dragging a field is narrated in English — and these strings are the ONLY
 * feedback a non-sighted user gets, since the insertion indicator is purely
 * visual. So they are translated like every other string in the builder.
 *
 * Targets are described in words rather than by id: "before depth in Sample" is
 * something an author can act on, "container:2" is not. The same describer feeds
 * the visible tooltip, so what is said and what is shown cannot drift.
 */

/** A step's human name, matching what its card header shows. */
const stepName = (steps, index, language) =>
  localized(steps[index]?.title, language, steps[index]?.id || `step-${index + 1}`);

/**
 * A phrase for whatever is currently under the drag.
 *
 * @param {Object} overData  the `data.current` of the droppable being hovered
 */
export function describeTarget(overData, steps, language) {
  if (!overData) return null;

  if (overData.type === "step") {
    return pick(
      language,
      `the ${stepName(steps, overData.index, language)} tab`,
      `l'onglet ${stepName(steps, overData.index, language)}`
    );
  }

  if (overData.type === "container") {
    if (overData.container === null || overData.container === undefined) {
      return pick(language, "no tab", "aucun onglet");
    }
    return pick(
      language,
      `the ${stepName(steps, overData.container, language)} tab`,
      `l'onglet ${stepName(steps, overData.container, language)}`
    );
  }

  if (overData.type === "field") {
    const where =
      overData.container === null || overData.container === undefined
        ? pick(language, "no tab", "aucun onglet")
        : pick(
            language,
            `the ${stepName(steps, overData.container, language)} tab`,
            `l'onglet ${stepName(steps, overData.container, language)}`
          );
    return pick(
      language,
      `${overData.name} in ${where}`,
      `${overData.name} dans ${where}`
    );
  }

  return null;
}

/** What is being dragged. */
function describeActive(activeData, steps, language) {
  if (activeData?.type === "step") {
    return pick(
      language,
      `the ${stepName(steps, activeData.index, language)} tab`,
      `l'onglet ${stepName(steps, activeData.index, language)}`
    );
  }
  return activeData?.name || "";
}

export function buildAnnouncements(language, getSteps) {
  const steps = () => getSteps() || [];

  return {
    onDragStart: ({ active }) => {
      const what = describeActive(active?.data?.current, steps(), language);
      return pick(language, `Picked up ${what}.`, `${what} saisi.`);
    },
    onDragOver: ({ over }) => {
      const target = describeTarget(over?.data?.current, steps(), language);
      if (!target) {
        return pick(
          language,
          "Not over a drop target.",
          "Hors d'une zone de dépôt."
        );
      }
      return pick(language, `Over ${target}.`, `Au-dessus de ${target}.`);
    },
    onDragEnd: ({ over }) => {
      const target = describeTarget(over?.data?.current, steps(), language);
      if (!target) {
        return pick(language, "Dropped. Nothing moved.", "Déposé. Rien n'a bougé.");
      }
      return pick(language, `Dropped on ${target}.`, `Déposé sur ${target}.`);
    },
    onDragCancel: () =>
      pick(language, "Move cancelled.", "Déplacement annulé."),
  };
}

export function buildScreenReaderInstructions(language) {
  return {
    draggable: pick(
      language,
      "Press space or enter to pick up. Use the arrow keys to move. Press space or enter again to drop, or escape to cancel. The move buttons on each row do the same thing without dragging.",
      "Appuyez sur espace ou entrée pour saisir. Utilisez les flèches pour déplacer. Appuyez de nouveau pour déposer, ou échap pour annuler. Les boutons de déplacement de chaque ligne font la même chose sans glisser."
    ),
  };
}
