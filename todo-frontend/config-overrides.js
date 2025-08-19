module.exports = {
  devServer: (configFunction) => {
    return (proxy, allowedHost) => {
      const config = configFunction(proxy, allowedHost);
      config.allowedHosts = ['.localhost', 'localhost', '127.0.0.1'];
      return config;
    };
  },
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
