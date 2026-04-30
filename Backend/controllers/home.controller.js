export const getHome = (req, res) => {
  res.json({
    message: "Anonymous Chat API",
    status: "running",
    version: "1.0.0"
  });
};