import React, { ChangeEvent, useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import "./App.scss";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { Button, Input } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import {
  generateShareText,
  getQuranData,
  initiateNumberOfReaders,
} from "./helper";
import { useLocalStorage } from "./hooks/useLocalStorage";

interface JuzukPageCount {
  jzk: number;
  pages: number[];
  totalPages: number;
}

export interface Reader {
  id: number;
  name: string;
  juzuk: JuzukPageCount[];
}

export interface QuranData {
  juzuks: number;
  pages: number[];
  start: number;
  end: number;
}

enum Language {
  "ms" = 0,
  "en",
}

function App() {
  const [userJuzuzkSelect, setUserJuzukSelect] = useLocalStorage<number>(
    "juzuk-select",
    1
  );
  const [allowCalculation, setAllowCalculation] = useState(false);
  const [readers, setReaders] = useLocalStorage<Reader[]>("readers", []);
  const [displayData, setDisplayData] = useLocalStorage<Boolean>(
    "display_data",
    false
  );
  const [language, setLanguage] = useLocalStorage<number>(
    "language",
    Language.ms
  );
  const [t, i18n] = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(Language[language]);
  }, [i18n, language]);

  useEffect(() => {
    setAllowCalculation(readers.every((reader) => reader.name !== ""));
  }, [readers]);

  function handleUserJuzukSelectChange(event: SelectChangeEvent<number>) {
    setUserJuzukSelect(Number(event.target.value));
  }

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: t("name_header", "Nama") as string,
      sortable: false,
      flex: 0.4,
    },
    {
      field: "juzuk",
      headerName: t("page_header", "Mukasurat") as string,
      sortable: false,
      flex: 0.6,
      valueGetter: (params) => {
        return params.value.filter(
          (item: JuzukPageCount) => item.jzk === userJuzuzkSelect
        )[0].pages;
      },
    },
  ];

  function handleReaderSelectOnChange(e: SelectChangeEvent<number>): void {
    setDisplayData(false);
    const initialNumberOfReaders = initiateNumberOfReaders(
      Number(e.target.value)
    );

    const updatedNoOfReaders = initialNumberOfReaders.map((reader) => {
      const readerExist = readers.find(
        (existingReader) => existingReader.id === reader.id
      );
      if (readerExist) {
        return {
          ...readerExist,
          totalPages: 0,
        };
      }

      return reader;
    });

    setReaders(updatedNoOfReaders);
  }

  //testing

  function handleNameInputChage(event: ChangeEvent<HTMLInputElement>) {
    const userId = Number(event.currentTarget.id.split("-")[1]);
    const value = event.currentTarget.value;
    const newReaders = readers.map((reader) => ({
      ...reader,
      name: userId === reader.id ? value : reader.name,
    }));
    setReaders(newReaders);
  }

  function calculatePagesPerJuzuk(readers: Reader[], juzuk: number) {
    const info = getQuranData();

    const selectedJuzuk = info.filter((item) => item.juzuks === juzuk)[0];
    const totalPages = selectedJuzuk.end - selectedJuzuk.start + 1;

    const evenNumberOfPagesPerPerson = Math.floor(totalPages / readers.length);
    let extraPages = totalPages - evenNumberOfPagesPerPerson * readers.length;

    const readersWithEvenTotalPages = readers.map((reader) => {
      return {
        ...reader,
        juzuk: reader.juzuk.map((item) => {
          if (item.jzk === juzuk) {
            return {
              ...item,
              totalPages: evenNumberOfPagesPerPerson,
            };
          }

          return item;
        }),
      };
    });

    for (let i = 0; i < extraPages; i++) {
      readersWithEvenTotalPages[
        i % readersWithEvenTotalPages.length
      ].juzuk.filter((item) => item.jzk === juzuk)[0].totalPages += 1;
    }
    let prevReaderTotalPages: number;

    const readersWithPagesFromJuzuk = readersWithEvenTotalPages.map(
      (reader, readerIndex) => {
        if (readerIndex === 0) {
          prevReaderTotalPages = 0;
        } else {
          prevReaderTotalPages =
            prevReaderTotalPages +
            readersWithEvenTotalPages[readerIndex - 1].juzuk.filter(
              (item) => item.jzk === juzuk
            )[0].totalPages;
        }

        return {
          ...reader,
          juzuk: reader.juzuk.map((item) => {
            if (item.jzk === juzuk) {
              return {
                ...item,
                pages: selectedJuzuk.pages.slice(
                  prevReaderTotalPages,
                  prevReaderTotalPages + item.totalPages
                ),
              };
            }

            return item;
          }),
        };
      }
    );

    return readersWithPagesFromJuzuk;
  }
  function calculatePages(readers: Reader[]) {
    getQuranData().forEach((item) => {
      readers = calculatePagesPerJuzuk(readers, item.juzuks);
    });

    return readers;
  }

  function handleCalculationClick(): void {
    const readersWithPagesFromJuzuk = calculatePages(readers);
    setReaders(readersWithPagesFromJuzuk);
    setDisplayData(true);
  }

  async function handleCopyPages() {
    const text = generateShareText(readers, userJuzuzkSelect);

    if ("clipboard" in navigator) {
      await navigator.clipboard.writeText(text);
      window.location.assign("whatsapp://app");
    } else {
      document.execCommand("copy", true, text);
    }
  }

  function handleLanguageChange(e: SelectChangeEvent<number>): void {
    setLanguage(Number(e.target.value));
    i18n.changeLanguage(Language[Number(e.target.value)]);
  }
  return (
    <Box sx={{ flexBox: 1, marginBottom: "30px" }}>
      <Grid container spacing={2}>
        <Grid
          item
          xs={12}
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h1"
            gutterBottom
            sx={{
              fontSize: "25px",
              padding: "20px 0 10px 0",
            }}
          >
            QuranShare
          </Typography>
          <Typography variant="subtitle1">
            {t("app_description", "Quran baca bersama")}
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Box>{t("language_select_text", "Pilih bahasa")}</Box>
            <Select
              value={language}
              onChange={handleLanguageChange}
              displayEmpty
              inputProps={{ "aria-label": "Without label" }}
            >
              <MenuItem value={0}>
                {t("selection_language_malay", "Melayu")}
              </MenuItem>
              <MenuItem value={1}>
                {t("selection_language_english", "Inggeris")}
              </MenuItem>
            </Select>
          </Box>
        </Grid>
        <Grid
          item
          xs={12}
          sx={{
            display: "flex",
            justifyContent: "space-evenly",
            alignItems: "center",
          }}
        >
          <Box>{t("select_reader", "Pilih bilangan pembaca")}</Box>
          <Select
            labelId="demo-simple-select-helper-label"
            value={readers.length}
            onChange={handleReaderSelectOnChange}
            displayEmpty
            inputProps={{ "aria-label": "Without label" }}
          >
            <MenuItem value={0}>{t("selection_reader_none", "Tiada")}</MenuItem>
            {Array.from(Array(20), (_, index) => (
              <MenuItem key={index} value={index + 1}>
                {index + 1}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        {readers.length !== 0 && (
          <Grid
            item
            xs={12}
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-evenly",
              alignItems: "center",
            }}
          >
            {readers.map((reader, index) => (
              <Box key={`input-${index + 1}`} className="input-group">
                <label htmlFor="number-of-reader">
                  {`${t("reader_label_text", "Pembaca")} ${index + 1} `}
                  <Input
                    id={`reader-${index + 1}`}
                    type="text"
                    placeholder={t("reader_placeholder", "Nama") as string}
                    value={reader.name}
                    onChange={handleNameInputChage}
                  />
                </label>
              </Box>
            ))}
            <Button
              sx={{
                margin: "10px 0",
              }}
              variant="contained"
              onClick={handleCalculationClick}
              disabled={!allowCalculation}
            >
              {t("calculate_button", "Kira")}
            </Button>
          </Grid>
        )}
        {displayData && (
          <>
            <Grid
              item
              xs={12}
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Typography
                  variant="h2"
                  textAlign="center"
                  sx={{
                    fontSize: "20px",
                  }}
                >
                  {t(
                    "readers_table_title",
                    "Senarai pembaca dan mukasurat yg perlu dibaca mengikut juzuk"
                  )}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <Box>{t("juzuk_selector_label", "Pilih Juzuk")}</Box>

                <Select
                  labelId="juzuk-select"
                  value={userJuzuzkSelect}
                  onChange={handleUserJuzukSelectChange}
                  inputProps={{ "aria-label": "Without label" }}
                  sx={{ width: "100px", margin: "10px 20px" }}
                >
                  {Array.from(Array(30), (_, index) => (
                    <MenuItem key={index} value={index + 1}>
                      {index + 1}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                paddingRight: "16px",
                "&.MuiGrid-item": {
                  paddingLeft: "36px",
                },
              }}
            >
              <Box style={{ height: 300, width: "100%" }}>
                <DataGrid
                  rows={readers}
                  columns={columns}
                  disableColumnMenu
                  slots={{
                    footer: () => (
                      <Box sx={{ padding: "10px" }}>
                        <Button
                          variant="contained"
                          size="large"
                          fullWidth
                          onClick={handleCopyPages}
                        >
                          {t(
                            "copy_data_button",
                            "Klik sini untuk copy maklumat ke Whatsapp"
                          )}
                        </Button>
                        <Box>
                          {t(
                            "copy_note",
                            "Nota: Sila paste dimana-mana message didalam Whatsapp"
                          )}
                        </Box>
                      </Box>
                    ),
                  }}
                />
              </Box>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
}

export default App;
