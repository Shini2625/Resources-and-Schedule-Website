# Resources and Architecture

## Technology Stack
1. **App Hosting**: Render
2. **Database**: Aiven MySQL (with Sequelize ORM)
3. **File Storage**: Cloudflare R2 (S3-compatible object storage via native AWS SigV4 presigned URLs)
4. **Authentication**: JWT (Access Token in response/cookies, Refresh Token in HTTP-only cookies)

---

## API Endpoints Overview (`/api/v1`)

### Health
- `GET /health` — Verifies database connection and server liveness.

### Authentication & Account (`/api/v1/auth`)
- `POST /register` — Register user (`fullName`, `email`, `password`, optional `username`).
- `POST /login` — Login user (`email`/`username` + `password`). Sets refresh token cookie.
- `POST /logout` — Clears refresh token cookie.
- `GET /me` — Returns current logged-in user profile.
- `PATCH /profile` — Update user profile (`fullName`, `username`, `bio`, `profileImage`, optional password change).
- `DELETE /me` — Delete current user account and cascade delete all associated data.
- `POST /refresh-token` (at `/api/v1/refresh-token`) — Issues new access token using refresh cookie.

### Courses (`/api/v1/courses`)
- `GET /` — List courses (supports `?year=1&semester=Semester+1&status=active`). Includes resources.
- `POST /` — Create course (`title`, `code`, `year`, `semester`, `description`, `credits`, `status`, `gradingPolicy`, `professorName`, `professorReview`, `customNotes`).
- `GET /:id` — Get single course with resources.
- `PATCH /:id` — Update course details.
- `DELETE /:id` — Delete course (cascades resources).

### Resources (`/api/v1/resources`)
- `GET /course/:courseId` — List course resources (supports `?category=notes&type=file`).
- `POST /course/:courseId` — Add resource (`title`, `category`, `type`, `description`, `fileUrl`, `externalLink`). Valid categories: `notes`, `references`, `tutorials`, `solutions`, `pyqs`, `grading`, `custom`, `slides`.
- `GET /:id` — Get resource by ID.
- `PATCH /:id` — Update resource.
- `DELETE /:id` — Delete resource.

### Timetable (`/api/v1/timetable`)
- `GET /` — List timetable entries, sorted chronologically (Monday to Sunday) and by start time. Supports `?dayOfWeek=Monday`.
- `POST /` — Add slot (`title`, `dayOfWeek`, `startTime`, `endTime`, `location`, `notes`, optional `courseId`).
- `GET /:id` — Get single entry.
- `PATCH /:id` — Update entry.
- `DELETE /:id` — Delete entry.

### To-Do & Deadlines (`/api/v1/todos`)
- `GET /` — List to-do items, sorted by completion status, due date, and priority (`urgent` > `high` > `medium` > `low`). Supports `?completed=false&priority=urgent&category=academic&courseId=1`.
- `POST /` — Create to-do (`title`, `description`, `dueDate`, `priority`, `category`, `colorCode`, optional `courseId`).
- `GET /:id` — Get to-do by ID.
- `PATCH /:id` — Update to-do.
- `PATCH /:id/toggle` — Toggle completion status.
- `DELETE /:id` — Delete to-do.

### Motivation Space (`/api/v1/motivation`)
- `GET /` — List all user quotes/images (pinned quotes first).
- `GET /active` — Get active/pinned motivation for dashboard display.
- `POST /` — Add motivation (`quote`, `imageUrl`, optional `isPinned`).
- `GET /:id` — Get entry by ID.
- `PATCH /:id` — Update entry.
- `PATCH /:id/pin` — Toggle pinned status.
- `DELETE /:id` — Delete entry.

### File Uploads (`/api/v1/upload`)
- `GET /config` — Check Cloudflare R2 storage readiness.
- `POST /presigned-url` — Generates a presigned PUT URL for direct client-to-R2 upload (`fileName`, `fileType`, optional `folder`).

---

## Database Schema & Migrations
Migrations are organized chronologically with dependencies resolved:
1. `202508230001-create-users.js`
2. `202508230002-create-courses.js`
3. `202508230003-create-resources.js`
4. `202508230004-create-timetable-entries.js`
5. `202508230005-create-todo-items.js`
6. `202508230006-create-motivation-entries.js`
