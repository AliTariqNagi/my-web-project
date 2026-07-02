# Flowtica FastAPI Backend — Past Project Style

This version follows the style of your previous FastAPI project:

- `app = FastAPI()`
- `get_db()` dependency using `SessionLocal()`
- `app.mount("/frontend", StaticFiles(...))`
- `/` redirects to the frontend
- routes are written directly in `app/main.py`
- models and schemas are imported from `app.models` and `app.schemas`

## Structure

```text
flowtica_fastapi_past_project_style/
  app/
    main.py
    models.py
    schemas.py
    database.py
    email_utils.py
    __init__.py
  frontend/
    index.html
    style.css
    script.js
    assets/
  requirements.txt
  .env.example
  run_local.py
```

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python run_local.py
```

Open:

```text
http://127.0.0.1:8000
```

API docs:

```text
http://127.0.0.1:8000/docs
```

## Main endpoints

```text
POST /contact/
POST /api/contact
GET  /all_inquiries/
GET  /inquiry/{inquiry_id}
POST /update_inquiry_status/{inquiry_id}

POST /book_consultation/
GET  /all_bookings/
POST /update_booking_status/{booking_id}
```

Admin endpoints require:

```text
X-Admin-Key: change-this-long-secret-key
```

## SMTP notification

Set these in `.env`:

```env
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USERNAME=your-username
SMTP_PASSWORD=your-password
SMTP_FROM=hello@flowtica.ai
NOTIFY_TO=your-email@example.com
SMTP_USE_TLS=true
```
