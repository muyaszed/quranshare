import React, { ChangeEvent, useState } from "react";
import Grid from "@mui/material/Grid";
import "./App.scss";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { Button, Input } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  generateShareText,
  getQuranData,
  initiateNumberOfReaders,
} from "./helper";

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

function App() {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [displayData, setDisplayData] = useState(false);
  const [userJuzuzkSelect, setUserJuzukSelect] = useState(1);

  function handleUserJuzukSelectChange(event: SelectChangeEvent<number>) {
    setUserJuzukSelect(Number(event.target.value));
  }

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Nama",
      sortable: false,
      flex: 0.4,
    },
    {
      field: "juzuk",
      headerName: "Mukasurat",
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
    } else {
      document.execCommand("copy", true, text);
    }
  }

  return (
    <Box sx={{ flexBox: 1 }}>
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
              padding: "20px",
            }}
          >
            Quran Share
          </Typography>
          <Typography variant="subtitle1">Quran baca bersama</Typography>
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
          <Box>Pilih bilangan pembaca</Box>
          <Select
            labelId="demo-simple-select-helper-label"
            value={readers.length}
            onChange={handleReaderSelectOnChange}
            displayEmpty
            inputProps={{ "aria-label": "Without label" }}
          >
            <MenuItem value={0}>None</MenuItem>
            {Array.from(Array(20), (_, index) => (
              <MenuItem value={index + 1}>{index + 1}</MenuItem>
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
                  {`Pembaca ${index + 1} `}
                  <Input
                    id={`reader-${index + 1}`}
                    type="text"
                    placeholder="Nama"
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
            >
              Kira
            </Button>
          </Grid>
        )}
        {displayData && (
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
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Box sx={{ padding: "0 10px" }}>
                <Button variant="contained" onClick={handleCopyPages}>
                  Copy
                </Button>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                <Box>Pilih Juzuk</Box>

                <Box>
                  <Select
                    labelId="juzuk-select"
                    value={userJuzuzkSelect}
                    onChange={handleUserJuzukSelectChange}
                    inputProps={{ "aria-label": "Without label" }}
                    sx={{ width: "100px", margin: "10px" }}
                  >
                    {Array.from(Array(30), (_, index) => (
                      <MenuItem value={index + 1}>{index + 1}</MenuItem>
                    ))}
                  </Select>
                </Box>
              </Box>
            </Box>
            <div style={{ height: 300, width: "100%" }}>
              <DataGrid
                rows={readers}
                columns={columns}
                hideFooterPagination
                disableColumnMenu
              />
            </div>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default App;
