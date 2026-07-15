// Returns today's date in strict YYYY-MM-DD format based on the server's local time
const todayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Adds a given number of days to a YYYY-MM-DD string
const addDays = (dateString, daysToAdd) => {
  const d = new Date(dateString);
  d.setDate(d.getDate() + daysToAdd);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Calculates the mathematical difference in days between two YYYY-MM-DD strings
const daysBetween = (startDateStr, endDateStr) => {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = end - start;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = { todayStr, addDays, daysBetween };