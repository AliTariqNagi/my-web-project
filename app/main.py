import os
import logging
from typing import List, Optional


from dotenv import load_dotenv

load_dotenv()


from fastapi import FastAPI, HTTPException, Depends, Query, status, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, RedirectResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.models import SessionLocal, engine, Base, BusinessInquiry, ConsultationBooking
from app.database import get_db
from app.schemas import (
    BusinessInquiryRequest,
    BusinessInquiryResponse,
    ConsultationBookingRequest,
    ConsultationBookingResponse,
    StatusUpdateRequest,
    MessageResponse,
)
from app.email_utils import send_business_notification


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Flowtica AI Backend")


# Create database tables
Base.metadata.create_all(bind=engine)



# ----------------------- CORS -----------------------
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:8000,http://localhost:8000"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------- Static frontend, like your old project -----------------------
# In your previous project you mounted /frontend and redirected / to frontend/main.html.
# Here we mount the frontend folder and redirect / to /frontend/index.html.
FRONTEND_DIR = os.getenv("FRONTEND_DIR", "frontend")
if os.path.exists(FRONTEND_DIR):
    app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="static_frontend")

ASSETS_DIR = os.path.join(FRONTEND_DIR, "assets")
if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")


@app.get("/")
async def root():
    if os.path.exists(os.path.join(FRONTEND_DIR, "index.html")):
        return RedirectResponse(url="/frontend/index.html")
    return {"message": "Flowtica AI Backend is running. Open /docs for API documentation."}


@app.get("/health")
async def health():
    return {"ok": True, "service": "Flowtica AI Backend"}


# ----------------------- Admin security -----------------------
def verify_admin_key(x_admin_key: Optional[str] = Header(default=None)):
    admin_key = os.getenv("ADMIN_API_KEY", "change-this-long-secret-key")
    if not x_admin_key or x_admin_key != admin_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing admin key")


# =====================================================================================
# BUSINESS WEBSITE CONTACT MODULE
# =====================================================================================

@app.post("/contact/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def submit_contact_form(
    payload: BusinessInquiryRequest,
    db: Session = Depends(get_db),
):
    """
    Contact form endpoint.

    Frontend can call:
    POST /contact/

    or use the alias:
    POST /api/contact
    """
    db_inquiry = BusinessInquiry(
        name=payload.name.strip(),
        email=str(payload.email).strip(),
        company=(payload.company or "").strip() or None,
        service=(payload.service or "").strip() or None,
        message=payload.message.strip(),
        source_page=(payload.source_page or "").strip() or None,
    )

    try:
        db.add(db_inquiry)
        db.commit()
        db.refresh(db_inquiry)

        try:
            await send_business_notification(
                subject=f"New Flowtica AI inquiry #{db_inquiry.id}: {db_inquiry.service or 'General inquiry'}",
                reply_to=db_inquiry.email,
                body=f"""New website inquiry received.

ID: {db_inquiry.id}
Name: {db_inquiry.name}
Email: {db_inquiry.email}
Company: {db_inquiry.company or "-"}
Service: {db_inquiry.service or "-"}
Source Page: {db_inquiry.source_page or "-"}

Message:
{db_inquiry.message}
""",
            )
        except Exception as email_error:
            logger.exception("Email notification failed: %s", email_error)

        return {"message": "Your message has been received. We will follow up soon.", "id": db_inquiry.id}

    except Exception as error:
        db.rollback()
        logger.exception("Failed to save inquiry: %s", error)
        raise HTTPException(status_code=500, detail="Failed to submit contact form")


@app.post("/api/contact", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def submit_contact_form_alias(
    payload: BusinessInquiryRequest,
    db: Session = Depends(get_db),
):
    return await submit_contact_form(payload=payload, db=db)


@app.get("/all_inquiries/", response_model=List[BusinessInquiryResponse], dependencies=[Depends(verify_admin_key)])
async def get_all_inquiries(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    query = db.query(BusinessInquiry).order_by(BusinessInquiry.created_at.desc())
    if status_filter:
        query = query.filter(BusinessInquiry.status == status_filter)
    return query.all()


@app.get("/inquiry/{inquiry_id}", response_model=BusinessInquiryResponse, dependencies=[Depends(verify_admin_key)])
async def get_inquiry(
    inquiry_id: int,
    db: Session = Depends(get_db),
):
    inquiry = db.query(BusinessInquiry).filter(BusinessInquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return inquiry


@app.post("/update_inquiry_status/{inquiry_id}", response_model=BusinessInquiryResponse, dependencies=[Depends(verify_admin_key)])
async def update_inquiry_status(
    inquiry_id: int,
    payload: StatusUpdateRequest,
    db: Session = Depends(get_db),
):
    allowed_statuses = {"new", "contacted", "booked", "closed", "spam"}
    if payload.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Use one of {sorted(allowed_statuses)}")

    inquiry = db.query(BusinessInquiry).filter(BusinessInquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    inquiry.status = payload.status
    db.commit()
    db.refresh(inquiry)
    return inquiry


# =====================================================================================
# CONSULTATION BOOKING MODULE
# =====================================================================================

@app.post("/book_consultation/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def book_consultation(
    payload: ConsultationBookingRequest,
    db: Session = Depends(get_db),
):
    booking = ConsultationBooking(
        name=payload.name.strip(),
        email=str(payload.email).strip(),
        company=(payload.company or "").strip() or None,
        service=(payload.service or "").strip() or None,
        preferred_date=(payload.preferred_date or "").strip() or None,
        preferred_time=(payload.preferred_time or "").strip() or None,
        timezone=(payload.timezone or "").strip() or None,
        notes=(payload.notes or "").strip() or None,
    )

    try:
        db.add(booking)
        db.commit()
        db.refresh(booking)

        try:
            await send_business_notification(
                subject=f"New consultation booking request #{booking.id}",
                reply_to=booking.email,
                body=f"""New consultation booking request.

ID: {booking.id}
Name: {booking.name}
Email: {booking.email}
Company: {booking.company or "-"}
Service: {booking.service or "-"}
Preferred Date: {booking.preferred_date or "-"}
Preferred Time: {booking.preferred_time or "-"}
Timezone: {booking.timezone or "-"}

Notes:
{booking.notes or "-"}
""",
            )
        except Exception as email_error:
            logger.exception("Booking email notification failed: %s", email_error)

        return {"message": "Your consultation request has been received.", "id": booking.id}

    except Exception as error:
        db.rollback()
        logger.exception("Failed to save booking: %s", error)
        raise HTTPException(status_code=500, detail="Failed to submit booking request")


@app.get("/all_bookings/", response_model=List[ConsultationBookingResponse], dependencies=[Depends(verify_admin_key)])
async def get_all_bookings(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    query = db.query(ConsultationBooking).order_by(ConsultationBooking.created_at.desc())
    if status_filter:
        query = query.filter(ConsultationBooking.status == status_filter)
    return query.all()


@app.post("/update_booking_status/{booking_id}", response_model=ConsultationBookingResponse, dependencies=[Depends(verify_admin_key)])
async def update_booking_status(
    booking_id: int,
    payload: StatusUpdateRequest,
    db: Session = Depends(get_db),
):
    allowed_statuses = {"requested", "confirmed", "rescheduled", "completed", "cancelled"}
    if payload.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Use one of {sorted(allowed_statuses)}")

    booking = db.query(ConsultationBooking).filter(ConsultationBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = payload.status
    db.commit()
    db.refresh(booking)
    return booking


# =====================================================================================
# UTILITY / EXPORT MODULE
# =====================================================================================

@app.get("/export_inquiries_json/", dependencies=[Depends(verify_admin_key)])
async def export_inquiries_json(db: Session = Depends(get_db)):
    inquiries = db.query(BusinessInquiry).order_by(BusinessInquiry.created_at.desc()).all()
    data = []
    for item in inquiries:
        data.append({
            "id": item.id,
            "name": item.name,
            "email": item.email,
            "company": item.company,
            "service": item.service,
            "message": item.message,
            "source_page": item.source_page,
            "status": item.status,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        })
    return JSONResponse(content=data)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
