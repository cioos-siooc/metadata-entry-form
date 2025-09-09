import React, {useState} from "react";
import {Typography} from "@material-ui/core";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router-dom";
import {En, Fr, I18n} from "../I18n";

const releaseNotesEn = require("../../releaseNotes/notes_en.md");
const releaseNotesFr = require("../../releaseNotes/notes_fr.md");

const WhatsNew = () => {
  const { language } = useParams();
  const [markdownContent, setMarkdownContent] = useState("")

    React.useEffect(() => {
      const releaseNotes = ((language === 'en') ? releaseNotesEn : releaseNotesFr)     
      fetch(releaseNotes)
          .then(response => response.text())
          .then(data => setMarkdownContent(data));
    }, [language]);

    return (
    <div>
      <Typography variant="h4">
        <I18n>
          <En>What's New</En>
          <Fr>Quoi de Neuf</Fr>
        </I18n>
      </Typography>
      <Typography>
        <I18n>
          <En>Recent software changes to this metdata entry tool:</En>
          <Fr>Modifications logicielles récentes apportées à cet outil de saisie de métadonnées:</Fr>
        </I18n>
      </Typography>

        <ReactMarkdown>
            { markdownContent }
        </ReactMarkdown>
    </div>
  );
}

export default WhatsNew;
