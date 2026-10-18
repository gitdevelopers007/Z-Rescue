from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Recommendation
from backend.app.schemas import RecommendationResponse
from backend.app.engines.recommendation_engine import recommendation_engine

router = APIRouter(prefix="/api/v1/recommendations", tags=["Recommendations"])

@router.get("", response_model=List[RecommendationResponse])
def list_recommendations(
    shipment_id: Optional[str] = Query(None, description="Filter by shipment ID"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    approved_only: Optional[bool] = Query(None, description="Filter by approval status"),
    db: Session = Depends(get_db)
):
    query = db.query(Recommendation)
    if shipment_id:
        query = query.filter(Recommendation.shipment_id == shipment_id)
    if priority:
        query = query.filter(Recommendation.priority == priority.upper())
    if approved_only is not None:
        query = query.filter(Recommendation.is_approved == approved_only)
    return query.order_by(Recommendation.created_at.desc()).all()

@router.post("/{rec_id}/approve", response_model=RecommendationResponse)
def approve_recommendation(
    rec_id: str,
    approver: str = Query("Supply Coordinator", description="Name/Role of authorized user"),
    db: Session = Depends(get_db)
):
    rec = recommendation_engine.approve_recommendation(rec_id, approver, db)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found.")
    return rec
