import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

import BilingualTextInput, {
  composeTranslationMessage,
  translationTarget,
  stripStampedTranslations,
} from "../BilingualTextInput";
import { UserContext } from "../../../providers/UserProvider";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useParams: () => ({ language: "en" }) };
});

const BASE = "Cohere command-a-translate-08-2025, cioos-commons@1.0.0";

describe("composeTranslationMessage (#551 flow chart)", () => {
  it.each([
    [false, false, "(translator / traducteur); human verified: no"],
    [false, true, "(translator / traducteur); human verified: yes"],
    [true, false, "(helper / assistant); human verified: no"],
    [true, true, "(helper / assistant); human verified: yes"],
  ])("modified=%s verified=%s", (modified, verified, expected) => {
    const msg = composeTranslationMessage({ base: BASE, modified, verified });
    expect(msg.startsWith(`${BASE} ${expected}`)).toBe(true);
  });
});

describe("translationTarget", () => {
  it("finds the AI-written language regardless of UI language", () => {
    const translations = {
      fr: { verified: true },
      en: { method: "cohere", base: BASE, modified: false, verified: false },
    };
    expect(translationTarget(translations, "fr").targetLang).toBe("en");
    expect(translationTarget(translations, "en").targetLang).toBe("en");
  });

  it("treats a pre-`method` service message as an AI translation", () => {
    const { targetLang, aiInfo } = translationTarget(
      { fr: { message: BASE, verified: false } },
      "en",
    );
    expect(targetLang).toBe("fr");
    expect(aiInfo).toMatchObject({ method: "cohere", base: BASE });
  });

  it("falls back to the alternate language when no AI was used", () => {
    expect(translationTarget({ fr: { verified: true } }, "fr")).toEqual({
      targetLang: "fr",
      aiInfo: undefined,
    });
  });
});

describe("stripStampedTranslations", () => {
  it("drops the generic stamped Cohere and Amazon messages", () => {
    expect(
      stripStampedTranslations({
        en: {
          message:
            "text translated using Cohere / texte traduit à l'aide de Cohere",
          verified: false,
        },
        fr: {
          message:
            "text translated using the Amazon translate service / texte traduit à l'aide du service de traduction Amazon",
          verified: false,
        },
      }),
    ).toEqual({ en: { verified: true }, fr: { verified: true } });
  });

  it("keeps real service messages and returns the same object", () => {
    const translations = { fr: { message: BASE, verified: false } };
    expect(stripStampedTranslations(translations)).toBe(translations);
  });
});

describe("BilingualTextInput", () => {
  it("typing the second language by hand records no translation message", () => {
    const onChange = vi.fn();
    render(
      <UserContext.Provider value={{ translate: vi.fn() }}>
        <BilingualTextInput
          name="title"
          value={{ en: "Estuary" }}
          onChange={onChange}
        />
      </UserContext.Provider>,
    );
    const frInput = screen.getAllByRole("textbox")[1];
    fireEvent.change(frInput, { target: { name: "fr", value: "Estuaire" } });
    expect(onChange).toHaveBeenLastCalledWith({
      target: {
        name: "title",
        value: {
          en: "Estuary",
          fr: "Estuaire",
          translations: { fr: { verified: true } },
        },
      },
    });
  });
});
