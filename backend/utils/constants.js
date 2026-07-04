// Constants file for the backend application
module.exports = {
  USER_TYPES: ["graduate", "investor", "admin"],

  PROJECT_STATUS: ["draft", "pending", "active", "published", "completed", "rejected"],

  INTERACTION_TYPES: ["like", "view", "contact", "favorite", "bookmark", "interest"],

  ACCEPTED_MAJORS: [
    "BSE (Software Engineering)",
    "BEL (Entrepreneurial Leadership)",
    "IBT (International Business Trade)",
  ],

  ACCEPTED_UNIVERSITY: "african leadership university",

  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB

  ALLOWED_FILE_TYPES: [".png", ".jpg", ".jpeg", ".pdf", ".mp4"],
};
