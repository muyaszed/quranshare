import React, { ChangeEvent, useState } from "react";
import Grid from "@mui/material/Grid";
import "./App.scss";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import { Button, Input } from "@mui/material";

interface JuzukPageCount {
  jzk: number;
  pages: number[];
  totalPages: number;
}

interface Reader {
  id: number;
  name: string;
  juzuk: JuzukPageCount[];
}

interface QuranData {
  juzuks: number;
  pages: number[];
  start: number;
  end: number;
}

function getQuranData(): QuranData[] {
  return Array.from(Array(30), (_, index) => {
    if (index === 0) {
      return {
        juzuks: 1,
        start: 1,
        end: 21,
        pages: Array.from(Array(21), (_, pagesIndex) => pagesIndex + 1),
      };
    }
    if (index === 29) {
      return {
        juzuks: 30,
        start: 582,
        end: 604,
        pages: Array.from(Array(23), (_, pagesIndex) => pagesIndex + 582),
      };
    }
    return {
      juzuks: index + 1,
      start: 22 + 20 * (index - 1),
      end: 41 + 20 * (index - 1),
      pages: Array.from(
        Array(20),
        (_, pagesIndex) => pagesIndex + 22 + 20 * (index - 1)
      ),
    };
  }).sort((first, second) => first.juzuks - second.juzuks);
}

function App() {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [numberOfJuzuk, setNumberOfJuzuk] = useState(2);
  const [displayData, setDisplayData] = useState(false);

  function handleReaderSelectOnChange(e: SelectChangeEvent<number>): void {
    const initialNumberOfReaders = Array.from<number[], Reader>(
      Array(Number(e.target.value)),
      (_, index) => {
        const data = getQuranData();
        return {
          id: index + 1,
          name: "",
          juzuk: data.map((item) => ({
            jzk: item.juzuks,
            pages: [],
            totalPages: 0,
          })),
        };

        // return {
        //   id: index + 1,
        //   name: "",
        //   juzuk: data.map((item) => ({
        //     jzk: item.juzuks,
        //     pages: [],
        //     totalPages: 0,
        //   })),
        // };
      }
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

  function handleNameInputChage() {}

  function calculatePagesPerJuzuk(readers: Reader[], juzuk: number) {
    const info = getQuranData();

    const selectedJuzuk = info.filter((item) => item.juzuks === juzuk)[0];
    const totalPages = selectedJuzuk.end - selectedJuzuk.start + 1;

    const evenNumberOfPagesPerPerson = Math.floor(totalPages / readers.length);
    let extraPages = totalPages - evenNumberOfPagesPerPerson * readers.length;
    console.log(
      "Data",
      selectedJuzuk.juzuks,
      evenNumberOfPagesPerPerson,
      extraPages
    );

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

  function handleJuzukSelectOnChange(e: ChangeEvent<HTMLSelectElement>) {
    setNumberOfJuzuk(Number(e.currentTarget.value));
  }

  console.log(getQuranData());
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
            <MenuItem value={1}>1</MenuItem>
            <MenuItem value={2}>2</MenuItem>
            <MenuItem value={3}>3</MenuItem>
            <MenuItem value={4}>4</MenuItem>
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={6}>6</MenuItem>
            <MenuItem value={7}>7</MenuItem>
            <MenuItem value={8}>8</MenuItem>
            <MenuItem value={9}>9</MenuItem>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={11}>11</MenuItem>
            <MenuItem value={12}>12</MenuItem>
            <MenuItem value={13}>13</MenuItem>
            <MenuItem value={14}>14</MenuItem>
            <MenuItem value={15}>15</MenuItem>
            <MenuItem value={16}>16</MenuItem>
            <MenuItem value={17}>17</MenuItem>
            <MenuItem value={18}>18</MenuItem>
            <MenuItem value={19}>19</MenuItem>
            <MenuItem value={20}>20</MenuItem>{" "}
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
            {Array.from(Array(readers.length), (_, index) => (
              <Box key={`input-${index + 1}`} className="input-group">
                <label htmlFor="number-of-reader">
                  {`Pembaca ${index + 1} `}
                  <Input
                    id={`reader-${index + 1}`}
                    type="text"
                    placeholder="Nama"
                    value={
                      readers.find((reader) => reader.id === index + 1)?.name ??
                      undefined
                    }
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
        {displayData &&
          readers.map((reader) => (
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
              <div>
                <div>name</div>
                <div>{reader.name}</div>
              </div>
              <div>
                <div>Juzuk</div>
                {reader.juzuk.map((singleJuzuk) => (
                  <>
                    <div>{singleJuzuk.jzk}</div>
                    <div>{`Pages: ${singleJuzuk.pages}`}</div>
                  </>
                ))}
              </div>
            </Grid>
          ))}
      </Grid>
    </Box>
    // <div className="App">
    //   <header>Quran Share</header>
    //   <div>Quran baca bersama</div>
    //   <div className="content">
    //     <div className="input-group">
    //       <label htmlFor="number-of-reader">
    //         Pilih bilangan pembaca
    //         <select
    //           id="number-of-reader"
    //           className="reader-select"
    //           value={readers.length}
    //           onChange={handleReaderSelectOnChange}
    //         >
    //           <option value={0}>None</option>
    //           <option value={1}>1</option>
    //           <option value={2}>2</option>
    //           <option value={3}>3</option>
    //           <option value={4}>4</option>
    //           <option value={5}>5</option>
    //           <option value={6}>6</option>
    //           <option value={7}>7</option>
    //           <option value={8}>8</option>
    //           <option value={9}>9</option>
    //           <option value={10}>10</option>
    //           <option value={11}>11</option>
    //           <option value={12}>12</option>
    //           <option value={13}>13</option>
    //           <option value={14}>14</option>
    //           <option value={15}>15</option>
    //           <option value={16}>16</option>
    //           <option value={17}>17</option>
    //           <option value={18}>18</option>
    //           <option value={19}>19</option>
    //           <option value={20}>20</option>
    //         </select>
    //       </label>
    //     </div>
    //     {Array.from(Array(readers.length), (_, index) => (
    //       <div key={`input-${index + 1}`} className="input-group">
    //         <label htmlFor="number-of-reader">
    //           {`Nama ${index + 1} `}
    //           <input
    //             id={`reader-${index + 1}`}
    //             type="text"
    //             value={
    //               readers.find((reader) => reader.id === index + 1)?.name ??
    //               undefined
    //             }
    //             onChange={handleNameInputChage}
    //           />
    //         </label>
    //       </div>
    //     ))}
    //     {readers.length !== 0 && (
    //       <div className="input-group">
    //         <label htmlFor="number-of-juzuk-per-day">
    //           Pilih bilangan juzuk untuk sehari
    //           <select
    //             id="number-of-juzuk-per-day"
    //             className="juzuk-select"
    //             value={1}
    //             onChange={handleJuzukSelectOnChange}
    //           >
    //             {getQuranData().map((item) => (
    //               <option value={item.j}>{item.j}</option>
    //             ))}
    //           </select>
    //         </label>
    //       </div>
    //     )}
    //     {readers.length > 0 && (
    //       <button onClick={handleCalculationClick}>Kira</button>
    //     )}
    //     {displayData &&
    //       readers.map((reader) => (
    //         <>
    //           <div>
    //             <div>name</div>
    //             <div>{reader.name}</div>
    //           </div>
    //           <div>
    //             <div>Juzuk</div>
    //             {reader.juzuk.map((singleJuzuk) => (
    //               <>
    //                 <div>{singleJuzuk.jzk}</div>
    //                 <div>{`Pages: ${singleJuzuk.pages}`}</div>
    //               </>
    //             ))}
    //           </div>
    //         </>
    //       ))}
    //   </div>
    // </div>
  );
}

export default App;
