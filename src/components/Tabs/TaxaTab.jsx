import React, { useState, useRef } from "react";
import arrayMove from "array-move";
import { Container, Draggable } from "react-smooth-dnd";
import { Paper,
    List,
    ListItem,
    ListItemText,
    Typography,
    Grid,
    TextField,
    Button,
    TableContainer,
    Table,
    TableBody,
    TableRow,
    TableCell,
    Box,
    ListItemSecondaryAction,
    Tooltip,
    IconButton,
    capitalize,
} from "@material-ui/core";
import { ArrowDownward, Delete } from "@material-ui/icons";
import Autocomplete from "@material-ui/lab/Autocomplete";
import axios from "axios";
import { useDebouncedCallback } from "use-debounce";
import { deepEquals } from "../../utils/misc";
import { En, Fr, I18n } from "../I18n";
import { paperClass, QuestionText, SupplementalText } from "../FormComponents/QuestionStyles";
import RequiredMark from "../FormComponents/RequiredMark";
import { validateField } from "../../utils/validate";


const TaxaTab = ({
    record,
    updateRecord,
    disabled,
}) => {
    const { taxa = [] } = record;
    const updateTaxa= updateRecord("taxa");
    const [activeTaxa, setActiveTaxa] = useState(0);

    const [inputValue, setInputValue] = useState("");
    const [SearchValue, setSearchValue] = useState("");

    const [data, setData] = useState([]);
    const mounted = useRef(false);
    const requestInProgress = useRef(false);

    const [currentTaxa, setTaxaItems] = useState(taxa);

    if (!deepEquals(currentTaxa, taxa)) {
        setTaxaItems(taxa);
    }
   
    function handleAdd() {
        if (SearchValue) {
            updateTaxa(taxa.concat(SearchValue))
            setActiveTaxa(taxa.length);
            setSearchValue("");
            setInputValue("");
        }
    }

    function removeItem(itemIndex) {
        updateTaxa(taxa.filter((e, index) => index !== itemIndex));
        if (taxa.length) setActiveTaxa(taxa.length - 2);
    }

    //  removedIndex is dragStart
    //  addedIndex is dragEnd
    function onDrop({ removedIndex, addedIndex }) {
        if (removedIndex === activeTaxa) setActiveTaxa(addedIndex);
        else if (addedIndex <= activeTaxa && removedIndex > activeTaxa)
            setActiveTaxa(activeTaxa + 1);

        const reorderedContacts = arrayMove(
            currentTaxa,
            removedIndex,
            addedIndex
        );

        updateTaxa(reorderedContacts);
    }

    function getActiveTaxaDetails() {
        if (taxa[activeTaxa]){
            const { rank, kingdom, phylum, class: Class, order, family, genus, species, scientificName, canonicalName, parent } = taxa[activeTaxa]
            const details = { rank, kingdom, phylum, Class, order, family, genus, species, scientificName, canonicalName, parent }
            return details
        }
        return {}

    }

    const gbifSearch = useDebouncedCallback((searchStr) => {
        const config = {
            method: "get",
            url: "https://api.gbif.org/v1/species/suggest",
            params: {
                q: searchStr,
            },
        };
        requestInProgress.current = true;
        axios(config).then((response) => {
            ;
            if (mounted.current) {
                setData([...response.data]);
            }
            requestInProgress.current = false;
        }).catch((error) => {
            /* eslint-disable no-console */
            console.error(error);
            requestInProgress.current = false;
        });
    }, 500);

    React.useEffect(() => {
        mounted.current = true;

        if (inputValue.length > 2 && !SearchValue && !requestInProgress.current){
            gbifSearch(inputValue);
        }

        return () => {
            mounted.current = false;
        };
    }, [inputValue, SearchValue, gbifSearch]);

    return (
        <Grid>
            <Paper style={paperClass}>
                <QuestionText>
                    <En>
                        Data processing history (provenance) for the resource.
                    </En>
                    <Fr>
                        Historique du traitement des données (provenance) pour la ressource.
                    </Fr>
                    <RequiredMark passes={validateField(record, "distribution")} />
                    <SupplementalText>
                        <I18n>
                            <En>
                                Enter Information about the events or source data used in constructing the data specified by the scope.
                            </En>
                            <Fr>
                                Entrez des informations sur les événements ou les données sources utilisées dans la construction des données spécifiées par la portée.
                            </Fr>
                        </I18n>
                    </SupplementalText>
                </QuestionText>
            </Paper>

            <Paper style={paperClass}>
                <Grid container direction="column" spacing={0}>

                    <Autocomplete
                        inputValue={inputValue}
                        onInputChange={(event, newInputValue) => {
                            setInputValue(newInputValue);
                        }}
                        getOptionLabel={(option) => (option.scientificName && (`${option.scientificName} (${option.canonicalName})`)) ?? option}
                        disabled={disabled}
                        // onChange={(e, keyword) =>
                        //     setSelectedKeywordAltLang(translate(keyword, altLanguage))
                        // }
                        loading={!requestInProgress.current}
                        onChange={(event, newValue) => {
                            if (typeof newValue === "object") {
                                setSearchValue(newValue);
                            }
                        }}
                        value={SearchValue}
                        freeSolo
                        options={data}
                        fullWidth
                        renderInput={(params) => (
                            <TextField
                                // eslint-disable-next-line react/jsx-props-no-spreading
                                {...params}
                                label='GBIF taxa Search'
                            />
                        )}
                    />

                </Grid>
                <Grid item xs={3}>
                    <Button
                        disabled={
                            disabled ||
                            (!SearchValue && !inputValue)
                        }
                        startIcon={<ArrowDownward />}
                        onClick={() => handleAdd()}
                    >
                        <I18n>
                            <En>Add</En>
                            <Fr>Ajouter</Fr>
                        </I18n>
                    </Button>
                </Grid>

                <Grid container direction="row" >
                    <Grid item xs={5}>
                        <Grid style={{ margin: "10px" }}>
                            <Typography variant="h6">
                                Taxa
                            </Typography>
                        </Grid>

                        <Box border={1} borderRadius="4px" borderColor="#ababab" margin="10px" >
                            <List>
                                <Container
                                    lockAxis="y"
                                    onDrop={(d) => onDrop(d)}
                                >
                                    {taxa.map((taxaItem, i) => {
                                        return (
                                            <Draggable key={i}>
                                                <ListItem
                                                    key={i}
                                                    button
                                                    onClick={() => setActiveTaxa(i)}
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Typography
                                                                style={{
                                                                    fontWeight: activeTaxa === i ? "bold" : "",
                                                                    width: "80%",
                                                                }}
                                                            >
                                                                {taxaItem && `${taxaItem.scientificName} (${taxaItem.canonicalName})`}
                                                            </Typography>
                                                        }
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <Tooltip
                                                            title={
                                                                <I18n
                                                                    en="Remove from this record"
                                                                    fr="Supprimer de cet enregistrement"
                                                                />
                                                            }
                                                        >
                                                            <span>
                                                                <IconButton
                                                                    onClick={() => removeItem(i)}
                                                                    edge="end"
                                                                    aria-label="clone"
                                                                    disabled={disabled}
                                                                >
                                                                    <Delete />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                            </Draggable>
                                        );
                                    })}
                                </Container>
                            </List>
                        </Box>
                    </Grid>

                    <Grid item xs={7}>
                        <Grid style={{ margin: "10px" }} >
                            <Typography variant="h6">
                                Details
                            </Typography>
                        </Grid>
                        <Box border={1} borderRadius="4px" borderColor="#ababab" margin="10px" minHeight="48px">
                            {taxa[activeTaxa] ? (
                            <TableContainer component={Paper}>
                                        <Table  size="small" aria-label="simple table">
                                    <TableBody>
                                        
                                                
                                        {Object.entries(getActiveTaxaDetails()).map(([key, value]) => (
                                                    <TableRow
                                                key={key}
                                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                                    >
                                                <TableCell component="th" scope="row" variant="head" align="left" style={{width:"146px"}}>
                                                    {capitalize(key)}:
                                                        </TableCell>
                                                <TableCell align="left">{value}</TableCell>
                                                    </TableRow>
                                                ))}        
                                            

                                        
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            ):""}

                        </Box>
                    </Grid>
                </Grid>



            </Paper>
        </Grid>
    );
};
export default TaxaTab;
