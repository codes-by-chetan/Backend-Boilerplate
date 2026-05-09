import os from "os";

const getHostIpAddress = () => {
  const networkInterfaces = os.networkInterfaces();

  for (const interfaceName of Object.keys(networkInterfaces)) {
    for (const network of networkInterfaces[interfaceName] || []) {
      if (network.family === "IPv4" && !network.internal) {
        return network.address;
      }
    }
  }

  return "127.0.0.1";
};

export default getHostIpAddress;
