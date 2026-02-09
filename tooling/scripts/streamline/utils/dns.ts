import dig from "node-dig-dns";

const INDIRECTION_LAYER_CNAME_SUFFIX = ".hostedon.isomer.gov.sg.";
const REDIRECTION_A_RECORDS = ["18.136.36.203", "18.138.108.8", "18.139.47.66"];

interface DnsResult {
  isCorrect: boolean;
  answer: string[];
}

// Checks if the domain's CNAME record points to the indirection layer
export const isDomainPointingToIndirectionLayer = async (
  domain: string
): Promise<DnsResult> => {
  const result = await dig([domain, "CNAME"]);

  if (!Object.keys(result).includes("answer") || result.answer.length === 0) {
    return {
      isCorrect: false,
      answer: [],
    };
  }

  const cnameRecord = result.answer[0];

  if (!cnameRecord) {
    return {
      isCorrect: false,
      answer: [],
    };
  }

  return {
    isCorrect: cnameRecord.value.endsWith(INDIRECTION_LAYER_CNAME_SUFFIX),
    answer: [cnameRecord.value],
  };
};

// Checks if the domain's A records match the expected redirection A records
export const isDomainARecordsCorrect = async (
  domain: string
): Promise<DnsResult> => {
  const result = await dig([domain, "A"]);

  if (!Object.keys(result).includes("answer") || result.answer.length === 0) {
    return {
      isCorrect: false,
      answer: [],
    };
  }

  const aRecords = result.answer.map((record) => record.value);
  const sortedARecords = [...aRecords].sort();
  const sortedExpectedARecords = [...REDIRECTION_A_RECORDS].sort();

  return {
    isCorrect:
      sortedARecords.length === sortedExpectedARecords.length &&
      sortedARecords.every(
        (value, index) => value === sortedExpectedARecords[index]
      ),
    answer: sortedARecords,
  };
};

// Checks if the domain's CNAME records match the expected value
export const isDomainCNAMERecordsCorrect = async (
  domain: string,
  expectedCNAME: string
): Promise<DnsResult> => {
  const result = await dig([domain, "CNAME"]);

  if (!Object.keys(result).includes("answer") || result.answer.length === 0) {
    return {
      isCorrect: false,
      answer: [],
    };
  }

  const cnameRecords = result.answer.map((record) => record.value);
  const sortedCNAMERecords = [...cnameRecords].sort();
  const sortedExpectedCNAMERecords = [expectedCNAME].sort();

  return {
    isCorrect:
      sortedCNAMERecords.length === sortedExpectedCNAMERecords.length &&
      sortedCNAMERecords.every(
        (value, index) => value === sortedExpectedCNAMERecords[index]
      ),
    answer: sortedCNAMERecords,
  };
};
