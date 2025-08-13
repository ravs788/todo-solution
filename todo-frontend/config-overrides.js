module.exports = {
  // Keep other rewired config...
  jest: function (config) {
    config.reporters = [
      "default",
      [
        "jest-junit",
        {
          "outputDirectory": "./test-results",
          "outputName": "junit.xml"
        }
      ]
    ];
    return config;
  },
};
