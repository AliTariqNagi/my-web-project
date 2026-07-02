from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class BusinessInquiryRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=160)
    email: EmailStr
    company: Optional[str] = Field(None, max_length=200)
    service: Optional[str] = Field(None, max_length=200)
    message: str = Field(..., min_length=2, max_length=5000)
    source_page: Optional[str] = Field(None, max_length=500)


class BusinessInquiryResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    company: Optional[str]
    service: Optional[str]
    message: str
    source_page: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConsultationBookingRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=160)
    email: EmailStr
    company: Optional[str] = Field(None, max_length=200)
    service: Optional[str] = Field(None, max_length=200)
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    timezone: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=5000)


class ConsultationBookingResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    company: Optional[str]
    service: Optional[str]
    preferred_date: Optional[str]
    preferred_time: Optional[str]
    timezone: Optional[str]
    notes: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class StatusUpdateRequest(BaseModel):
    status: str


class MessageResponse(BaseModel):
    message: str
    id: Optional[int] = None
