// Note: maxConcurrency is set to 1 because we want to run the CI for each page one at a time for most accurate results
export default {
  puppeteerClusterOptions: {
    maxConcurrency: 1,
  },
  scanner: {
    samples: 1,
  },
};
