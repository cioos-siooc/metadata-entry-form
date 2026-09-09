# Exigences conditionnelles

La référence des champs générée décrit **ce qu'est chaque champ**. Cette page
décrit **les règles qui portent sur plusieurs champs à la fois** — les cas où
le caractère obligatoire d'un champ dépend de la valeur d'un autre.

Ces règles sont exprimées dans `record.submission.schema.json`, que tout
enregistrement doit satisfaire pour être soumis. Elles ne figurent
volontairement *pas* dans `record.schema.json` : un brouillon incomplet reste
structurellement un enregistrement.

---

## Étendue géographique

Un enregistrement doit indiquer la provenance des données, de l'une des trois
façons suivantes :

| Catégorie thématique | Accepté |
|---|---|
| Biote (`biota`, ou l'ancien `biological`) | Un cadre de délimitation, **ou** un polygone, **ou** une description textuelle |
| Toute autre catégorie | Un cadre de délimitation **ou** un polygone. Une description seule ne suffit pas. |

Un cadre de délimitation n'est retenu que si ses quatre limites sont présentes
et numériques. Contraintes supplémentaires, vérifiées séparément parce que JSON
Schema ne peut pas les exprimer :

- `north` doit être supérieur ou égal à `south`, et `east` supérieur ou égal à
  `west`
- les latitudes doivent se situer entre -90 et 90 ; les longitudes entre -360
  et 360
- un polygone doit comporter au moins deux points, et son premier point doit
  être identique au dernier (il doit être fermé)

## Champs pouvant être écartés

Trois cases à cocher désactivent une section autrement obligatoire. Chacune
correspond à une valeur booléenne réelle stockée dans l'enregistrement.

| Cochez ceci | …et ces champs cessent d'être obligatoires |
|---|---|
| `noVerticalExtent` | `verticalExtentMin`, `verticalExtentMax`, `verticalExtentDirection` |
| `noTaxa` | `taxa` |
| `noPlatform` | `platforms` |

## Plateformes et instruments

Un enregistrement satisfait à l'exigence de plateforme si **l'une** des
conditions suivantes est remplie :

- `noPlatform` est coché, **ou**
- chaque entrée de `platforms` possède à la fois un `type` et un `id`, **ou**
- l'enregistrement n'a pas de `metadataScope`, **ou** son `metadataScopeIso`
  vaut `model` (un modèle n'a pas de plateforme de collecte)

Les instruments suivent leur propre règle, conditionnée par le nombre de
plateformes :

- chaque instrument doit toujours avoir un `id`
- dès que **deux plateformes ou plus** sont définies, chaque instrument doit
  également indiquer la `platform` à laquelle il appartient — avec une seule
  plateforme l'association est sans ambiguïté, elle n'est donc pas exigée

## Contacts

Chaque contact doit individuellement avoir au moins un `role`, ainsi qu'au
moins l'un des champs `orgName`, `givenNames` ou `lastName`.

La liste de contacts *dans son ensemble* doit en outre comporter :

- au moins un contact ayant le rôle **Dépositaire des métadonnées**
  (`custodian`)
- au moins un contact ayant le rôle **Propriétaire des données** (`owner`)
- au moins un contact dont `inCitation` est coché

Un même contact peut satisfaire plusieurs de ces conditions.

## Généalogie des données

Pour chaque étape de généalogie :

- chaque entrée de `processingStep` doit avoir un `title` et une `description`
- chaque entrée de `source` doit avoir un `title` et une `description`
- une étape dont le `scopeIso` vaut `collectionSession` doit également
  comporter un `statement` en anglais et en français

> **Écart connu.** Le validateur du formulaire vérifie `scope` plutôt que
> `scopeIso` pour cette dernière règle. Comme `scope` contient une *clé* de
> cadre (`DataCollectionSampling`) alors que `collectionSession` est la valeur
> ISO de cette clé, les deux ne correspondent jamais et la règle n'a en réalité
> jamais bloqué de soumission. Le schéma exprime la règle voulue. Voir le
> README §11.

## Ressources connexes

Chaque entrée de `associated_resources` doit comporter les quatre éléments
suivants : un `title` dans les deux langues, une `authority`, un `code` et un
`association_type`.

## Ressources

Au moins une entrée de `distribution` doit comporter à la fois un `name` et une
`url` valide. Les autres entrées peuvent être incomplètes.

## Variables océaniques essentielles

Au moins une VOE est requise. Les VOE **dépréciées** en amont dans
`cioos-commons` restent structurellement valides — les enregistrements
existants en contiennent encore — mais empêchent la soumission tant qu'elles ne
sont pas remplacées.

## Texte bilingue

`title` et `abstract` exigent **les deux** langues, anglais et français.

`keywords` exige au moins un mot-clé dans **l'une ou l'autre** des langues.

Les descriptions géographiques exigent au moins une langue.
