import { QuranData, Reader } from "./App";

export function getQuranData(): QuranData[] {
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

export function initiateNumberOfReaders(numberOfReaders: number) {
  return Array.from<number[], Reader>(
    Array(Number(numberOfReaders)),
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
    }
  );
}

export function generateShareText(readers: Reader[], selectedJuzuk: number) {
  const text = `Bacaan untuk hari ini
******************************************

Juzuk ${selectedJuzuk}
${readers
  .map(
    (reader) =>
      `${reader.name} - Mukasurat: ${
        reader.juzuk.filter((item) => item.jzk === selectedJuzuk)[0].pages
      }\n`
  )
  .join("")}`;

  return text;
}
