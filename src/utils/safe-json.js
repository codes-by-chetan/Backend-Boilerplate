const safeJson = (value) => {
  if (value === undefined) {
    return null;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return {
      serializationError: error.message,
      fallback: String(value),
    };
  }
};

export default safeJson;
