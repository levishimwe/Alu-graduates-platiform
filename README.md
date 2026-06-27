# ALU Graduates Empowerment Platform
> Connecting ALU's brightest innovations with the investors, sponsors, and buyers who can bring them to life.

---

## African Context

Africa produces thousands of highly skilled graduates every year, yet many innovative projects developed during their studies never reach the people who could fund or scale them. At African Leadership University (ALU), graduates consistently build high-potential solutions — but after graduation, institutional visibility fades and there is no centralized space to bridge that gap.

This platform solves that problem by giving ALU graduates a dedicated digital space to showcase their projects to investors, sponsors, and buyers across Africa and beyond. It directly supports entrepreneurship, job creation, and socio-economic development by turning hidden talent into visible opportunity.

---

## Team Members

| Name | Role | Student ID |
|------|------|------------|
| Levis Ishimwe | Full-Stack Developer & DevOps | i.levis@alustudent.com |
| Obasi-Otani Owai Ibe | Backend Developer | o.ibe@alustudent.com |
| Elise Julio HAKIZIMANA | Frontend Developer | j.hakiziman1@alustudent.com |

---

## Project Overview

The **ALU Graduates Empowerment Platform** is a web-based application that allows ALU graduates to create profiles, upload their projects, and connect directly with potential investors, sponsors, and buyers. Each project listing includes a description, category, media (images/videos), GitHub repository link, LinkedIn profile, and contact details.

Stakeholders — investors, sponsors, and buyers — can browse, search, and filter projects by category, impact area, or location. When they find a project they are interested in, they can reach out directly to the graduate through the platform's built-in contact system.

The platform is built with a modern, mobile-first design using React.js and Tailwind CSS on the frontend, Node.js/Express on the backend, and MongoDB as the database — making it fast, scalable, and accessible to users across Africa on any device or connection speed.

---

## Target Users

- **ALU Graduates** — individuals or teams who want to showcase their projects and attract support
- **Investors & Sponsors** — organizations or individuals actively looking for African innovation to fund or partner with
- **Buyers** — entities interested in purchasing or licensing graduate-built solutions
- **Platform Admins** — ALU staff who moderate content and manage platform activity

---

## Core Features

- **Graduate Profiles** — Graduates create accounts and build detailed profiles with their bio, ALU cohort, and contact information
- **Project Listings** — Upload projects with title, description, category, images, video, GitHub link, and LinkedIn profile
- **Search & Filter** — Investors can browse projects filtered by category, impact area, or location
- **Direct Contact** — Stakeholders can reach out to graduates directly via email or LinkedIn from the platform
- **Engagement Dashboard** — Graduates can track project views, messages received, and overall engagement metrics
- **Admin Moderation Panel** — Admins can approve, reject, or flag content and monitor platform activity

---

## Technology Stack

- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (MongoDB Atlas)
- **Authentication:** JWT (JSON Web Tokens)
- **Media Storage:** Cloudinary
- **Email Notifications:** Nodemailer / SendGrid
- **Version Control:** Git & GitHub
- **Deployment:** Render (Backend), Vercel (Frontend)

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm v9+
- MongoDB Atlas account (or local MongoDB instance)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ALU-BSE/[repo-name].git
   cd [repo-name]
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file inside the `backend/` folder:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

5. **Run the backend server**
   ```bash
   cd backend
   npm run dev
   ```

6. **Run the frontend**
   ```bash
   cd ..
   npm start
   ```

7. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## Usage

- Visit the homepage to browse featured projects
- **Graduates:** Sign up, create your profile, and upload your first project
- **Investors/Sponsors:** Browse the projects page, use filters to find relevant innovations, and contact graduates directly
- **Admins:** Access the admin panel via `/admin` with admin credentials

---

## Project Structure

```
Alu-Graduates-platiform/               # Project root (React frontend)
├── backend/                         # Node.js/Express backend
│   ├── config/                      # DB connection & environment config
│   ├── controllers/                 # Route handler logic
│   ├── doc/                         # API & project documentation
│   ├── middleware/                  # Auth, error handling, validation
│   ├── models/                      # Mongoose models
│   ├── mongoModels/                 # Extended MongoDB models
│   ├── routes/                      # Express API route definitions
│   ├── services/                    # Business logic & third-party services
│   ├── socket/                      # Socket.IO real-time communication
│   ├── utils/                       # Backend helper functions
│   ├── app.js                       # Express app setup
│   ├── server.js                    # Server entry point
│   ├── test-server.js               # Server test file
│   └── package.json                 # Backend dependencies
├── public/                          # Static public assets
├── src/                             # React frontend source
│   ├── components/                  # Reusable UI components
│   ├── context/                     # Global state (Context API)
│   ├── data/                        # Static/mock data
│   ├── hooks/                       # Custom React hooks
│   ├── services/                    # API call functions
│   ├── styles/                      # Global and component styles
│   ├── utils/                       # Frontend utility functions
│   ├── App.js                       # Root component
│   ├── App.css                      # Root styles
│   └── index.js                     # React entry point
├── .env                             # Frontend environment variables
├── .gitignore                       # Git ignore rules
├── package.json                     # Frontend dependencies
├── postcss.config.js                # PostCSS configuration
├── tailwind.config.js               # Tailwind CSS configuration
├── setupTests.js                    # Test setup
├── reportWebVitals.js               # Performance reporting
└── README.md
```

---

## Links

- [Project Board](https://github.com/ALU-BSE/[repo-name]/projects)
- [API Documentation](./docs/api.md) *(coming soon)*

---

## License

This project is licensed under the [MIT License](./LICENSE).
