import Stack from "@mui/material/Stack";
import { useState } from "react";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CircularProgress from "@mui/material/CircularProgress";
import { useI18n } from "../../hooks/I18n";
import Box from "@mui/material/Box";
import { useFavWords } from "../../hooks/FavWords";
import DictCont from "../Selection/DictCont";
import SugCont from "../Selection/SugCont";
import DownloadButton from "./DownloadButton";
import UploadButton from "./UploadButton";
import Button from "@mui/material/Button";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import { isValidWord } from "../../libs/utils";
import { kissLog } from "../../libs/log";
import { apiTranslate } from "../../apis";
import { OPT_TRANS_BAIDU, PHONIC_MAP } from "../../config";

function FavAccordion({ word, index }) {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (e) => {
    setExpanded((pre) => !pre);
  };

  return (
    <Accordion expanded={expanded} onChange={handleChange}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        {/* <Typography>{`[${new Date(
          createdAt
        ).toLocaleString()}] ${word}`}</Typography> */}
        <Typography>{`${index + 1}. ${word}`}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {expanded && (
          <Stack spacing={2}>
            <DictCont text={word} />
            <SugCont text={word} />
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export default function FavWords() {
  const i18n = useI18n();
  const { loading, favWords, mergeWords, clearWords } = useFavWords();
  const favList = Object.entries(favWords).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  const downloadList = favList.map(([word]) => word);

  const handleImport = async (data) => {
    try {
      const newWords = data
        .split("\n")
        .map((line) => line.split(",")[0].trim())
        .filter(isValidWord);
      await mergeWords(newWords);
    } catch (err) {
      kissLog(err, "import rules");
    }
  };

  const handleTranslation = async () => {
    const tranList = [];
    for (const text of downloadList) {
      try {
        const dictRes = await apiTranslate({
          text,
          translator: OPT_TRANS_BAIDU,
          fromLang: "en",
          toLang: "zh-CN",
        });
        if (dictRes[2]?.type === 1) {
          tranList.push(JSON.parse(dictRes[2].result));
        }
      } catch (err) {
        // skip
      }
    }

    return tranList
      .map((dictResult) =>
        [
          `## ${dictResult.src}`,
          dictResult.voice
            ?.map(Object.entries)
            .map((item) => item[0])
            .map(([key, val]) => `${PHONIC_MAP[key]?.[0] || key} ${val}`)
            .join(" "),
          dictResult.content[0].mean
            .map(({ pre, cont }) => {
              return `  - ${pre ? `[${pre}] ` : ""}${Object.keys(cont).join("; ")}`;
            })
            .join("\n"),
        ].join("\n\n")
      )
      .join("\n\n");
  };

  return (
    <Box>
      <Stack spacing={3}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          useFlexGap
          flexWrap="wrap"
        >
          <UploadButton
            text={i18n("import")}
            handleImport={handleImport}
            fileType="text"
            fileExts={[".txt", ".csv"]}
          />
          <DownloadButton
            handleData={() => downloadList.join("\n")}
            text={i18n("export")}
            fileName={`kiss-words_${Date.now()}.txt`}
          />
          <DownloadButton
            handleData={handleTranslation}
            text={i18n("export_translation")}
            fileName={`kiss-words_${Date.now()}.md`}
          />
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              clearWords();
            }}
            startIcon={<ClearAllIcon />}
          >
            {i18n("clear_all")}
          </Button>
        </Stack>

        <Box>
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            favList.map(([word, { createdAt }], index) => (
              <FavAccordion
                key={word}
                index={index}
                word={word}
                createdAt={createdAt}
              />
            ))
          )}
        </Box>
      </Stack>
    </Box>
  );
}
